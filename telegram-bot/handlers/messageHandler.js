// handlers/messageHandler.js
import { userDb, conversationDb, diagnosticDb, actionLogDb } from '../database/db.js';
import { callAI, buildActionLogNarrative } from '../utils/ai.js';
import { diagnosticQuestions, getAnswerScore, buildDiagnosticSummary } from '../utils/diagnostic.js';
import { config } from '../config/config.js';

// Message batch queue per user
const messageBatchQueues = new Map();
const messageBatchTimers = new Map();

/**
 * Handle text messages from users
 */
export async function handleTextMessage(bot, msg) {
    const telegramId = msg.from.id;
    const text = msg.text;

    // Get or create user
    const user = userDb.getOrCreate(telegramId, msg.from);

    // Add to conversation history
    conversationDb.add(telegramId, 'user', text);

    // Log user action
    actionLogDb.log(telegramId, 'text_message', { message: text });

    console.log(`📨 Message from ${user.first_name || 'User'} (${telegramId}): ${text.substring(0, 50)}...`);

    // Check current state
    const currentState = user.current_state;

    // 🔐 PHONE VERIFICATION STATE
    if (currentState === 'phone_verification') {
        await handlePhoneVerification(bot, telegramId, text, user);
        return;
    }

    // Check if blocked
    if (currentState === 'blocked') {
        const lang = user.language || 'ro';
        const blockedText = lang === 'ru' ?
            `⛔ Доступ заблокирован.\n\nСвяжись с поддержкой для получения доступа:\n👉 https://t.me/oowell_support` :
            `⛔ Acces blocat.\n\nContactează suportul pentru acces:\n👉 https://t.me/oowell_support`;
        await bot.sendMessage(telegramId, blockedText);
        return;
    }

    // 📝 DIAGNOSTIC QUESTION STATE
    const diagnosticMatch = currentState.match(/^diagnostic_q(\d+)$/);
    if (diagnosticMatch) {
        const questionNum = parseInt(diagnosticMatch[1]);
        await handleDiagnosticTextAnswer(bot, telegramId, questionNum, text, user);
        return;
    }

    // 📝 ENROLLMENT STATES
    if (currentState === 'enrollment_phone') {
        await handleEnrollmentPhone(bot, telegramId, text, user);
        return;
    }

    if (currentState === 'enrollment_name') {
        await handleEnrollmentName(bot, telegramId, text, user);
        return;
    }

    if (currentState === 'enrollment_email') {
        await handleEnrollmentEmail(bot, telegramId, text, user);
        return;
    }

    // 💬 FREE CHAT - Batch messages and send to AI
    await handleBatchedAIChat(bot, telegramId, text, user);
}

/**
 * Handle phone verification
 */
async function handlePhoneVerification(bot, telegramId, text, user) {
    const lang = user.language || 'ro';

    // Check if looks like phone number
    const looksLikePhone = /^[\d\s\+\-\(\)]{7,}$/.test(text);

    if (!looksLikePhone) {
        // User is chatting, not entering phone - send to AI
        console.log('📨 User chatting before auth, sending to AI...');
        await handleBatchedAIChat(bot, telegramId, text, user);
        return;
    }

    // Verify phone number
    const cleanPhone = text.replace(/[\s\-\(\)]/g, '');
    const isValid = config.auth.authorizedPhones.includes(cleanPhone);

    if (isValid) {
        // ✅ Phone verified
        userDb.authenticate(telegramId, cleanPhone);

        const successText = lang === 'ru' ?
            `✅ Отлично! Номер подтвержден.\n\nДобро пожаловать в программу OO.WELL! 🎉` :
            `✅ Perfect! Număr confirmat.\n\nBine ai venit în programul OO.WELL! 🎉`;

        await bot.sendMessage(telegramId, successText);

        // Show main menu after 1 second
        setTimeout(async () => {
            const { showMainMenu } = await import('./commandHandler.js');
            await showMainMenu(bot, telegramId);
        }, 1000);
    } else {
        // ❌ Phone not authorized
        const attempts = userDb.incrementPhoneAttempts(telegramId);

        if (attempts >= config.auth.maxPhoneAttempts) {
            // Block access
            userDb.update(telegramId, { current_state: 'blocked' });

            const blockText = lang === 'ru' ?
                `❌ Извини, доступ ограничен.\n\nТвой номер не найден в списке участников программы.\n\n📞 Для получения доступа, свяжись с поддержкой:\n👉 https://t.me/oowell_support` :
                `❌ Ne pare rău, acces limitat.\n\nNumărul tău nu a fost găsit în lista participanților.\n\n📞 Pentru acces, contactează suportul:\n👉 https://t.me/oowell_support`;

            await bot.sendMessage(telegramId, blockText);
        } else {
            // Give another chance
            const remainingAttempts = config.auth.maxPhoneAttempts - attempts;
            const retryText = lang === 'ru' ?
                `❌ Номер не найден в списке участников.\n\n🔄 Осталось попыток: ${remainingAttempts}\n\nПопробуй снова или свяжись с поддержкой:\n👉 https://t.me/oowell_support` :
                `❌ Număr negăsit în lista participanților.\n\n🔄 Încercări rămase: ${remainingAttempts}\n\nÎncearcă din nou sau contactează suportul:\n👉 https://t.me/oowell_support`;

            await bot.sendMessage(telegramId, retryText);
        }
    }
}

/**
 * Handle diagnostic text answer
 */
async function handleDiagnosticTextAnswer(bot, telegramId, questionNum, text, user) {
    const lang = user.language || 'ro';
    const questions = diagnosticQuestions[lang];
    const question = questions[questionNum - 1];

    // Validate answer
    const answerLower = text.toLowerCase().trim();
    const matchesOption = question.options.some(opt =>
        opt.toLowerCase().includes(answerLower) ||
        answerLower.includes(opt.toLowerCase()) ||
        (answerLower.match(/^[1-4]$/) && opt === question.options[parseInt(answerLower) - 1])
    );

    if (answerLower.length < 2 || (!matchesOption && answerLower.length < 4)) {
        const clarifyText = lang === 'ru' ?
            '🤔 Не совсем поняла твой ответ. Выбери один из вариантов выше или напиши более четко.' :
            '🤔 Nu am înțeles răspunsul. Alege una din opțiunile de mai sus sau scrie mai clar.';

        await bot.sendMessage(telegramId, clarifyText);
        return;
    }

    // Find best matching option
    let bestMatch = text;
    for (const opt of question.options) {
        if (opt.toLowerCase().includes(answerLower) || answerLower.includes(opt.toLowerCase())) {
            bestMatch = opt;
            break;
        }
    }

    // Save answer
    const score = getAnswerScore(bestMatch, lang);
    diagnosticDb.saveAnswer(telegramId, questionNum, bestMatch, score);

    // Log action
    actionLogDb.log(telegramId, 'diagnostic_answer', {
        questionNum: questionNum,
        answer: bestMatch,
        fromButton: false
    });

    // Move to next question or show results
    if (questionNum < 10) {
        userDb.update(telegramId, { current_state: `diagnostic_q${questionNum + 1}` });

        setTimeout(async () => {
            const { showDiagnosticQuestion } = await import('./diagnosticHandler.js');
            await showDiagnosticQuestion(bot, telegramId, questionNum + 1);
        }, 500);
    } else {
        // Diagnostic complete
        actionLogDb.log(telegramId, 'diagnostic_completed', { totalAnswers: 10 });

        setTimeout(async () => {
            const { showDiagnosticResults } = await import('./diagnosticHandler.js');
            await showDiagnosticResults(bot, telegramId);
        }, 800);
    }
}

/**
 * Handle enrollment phone
 */
async function handleEnrollmentPhone(bot, telegramId, text, user) {
    const lang = user.language || 'ro';

    // Validate phone format
    const isValidPhone = /^[\d\s\+\-\(\)]{7,}$/.test(text);

    if (!isValidPhone) {
        const errorText = lang === 'ru' ?
            '⚠️ Пожалуйста, введи корректный номер телефона.\n\nПример: +373 69 123 456 или 069123456' :
            '⚠️ Te rog, introdu un număr de telefon valid.\n\nExemplu: +373 69 123 456 sau 069123456';

        await bot.sendMessage(telegramId, errorText);
        return;
    }

    // Save temporarily
    userDb.update(telegramId, {
        current_state: 'enrollment_name',
        metadata: JSON.stringify({ enrollment_phone: text })
    });

    const askNameText = lang === 'ru' ?
        `✅ Отлично! Номер сохранен.\n\nТеперь скажи, как тебя зовут?` :
        `✅ Perfect! Numărul salvat.\n\nAcum spune-mi, cum te cheamă?`;

    await bot.sendMessage(telegramId, askNameText);
}

/**
 * Handle enrollment name
 */
async function handleEnrollmentName(bot, telegramId, text, user) {
    const lang = user.language || 'ro';

    // Save name
    const metadata = user.metadata ? JSON.parse(user.metadata) : {};
    metadata.enrollment_name = text;

    userDb.update(telegramId, {
        current_state: 'enrollment_email',
        metadata: JSON.stringify(metadata)
    });

    const askEmailText = lang === 'ru' ?
        `Приятно познакомиться, ${text}! 😊\n\nЕсли хочешь, оставь также email (или просто нажми "Продолжить"):` :
        `Îmi pare bine să te cunosc, ${text}! 😊\n\nDacă vrei, lasă și email-ul (sau apasă "Continuă"):`;

    const { getEnrollmentSkipEmailKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, askEmailText, {
        reply_markup: getEnrollmentSkipEmailKeyboard(lang)
    });
}

/**
 * Handle enrollment email
 */
async function handleEnrollmentEmail(bot, telegramId, text, user) {
    const lang = user.language || 'ro';

    // Validate email
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

    if (!isValidEmail && text !== 'skip') {
        const errorText = lang === 'ru' ?
            '⚠️ Пожалуйста, введи корректный email.\n\nПример: maria@email.com' :
            '⚠️ Te rog, introdu un email valid.\n\nExemplu: maria@email.com';

        await bot.sendMessage(telegramId, errorText);
        return;
    }

    // Complete enrollment
    const metadata = user.metadata ? JSON.parse(user.metadata) : {};
    const { enrollmentDb } = await import('../database/db.js');

    enrollmentDb.create(
        telegramId,
        metadata.enrollment_name || 'Unknown',
        metadata.enrollment_phone || user.phone || 'Unknown',
        text !== 'skip' ? text : null
    );

    userDb.update(telegramId, { current_state: 'main_menu' });

    const successText = lang === 'ru' ?
        `✅ Отлично! Заявка отправлена.\n\nНаш куратор свяжется с тобой в течение 24 часов.\n\nА пока можешь посмотреть бесплатный урок! 🎁` :
        `✅ Perfect! Cererea a fost trimisă.\n\nCuratorul nostru te va contacta în 24 de ore.\n\nÎntre timp, poți vedea lecția gratuită! 🎁`;

    const { getPostEnrollmentKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, successText, {
        reply_markup: getPostEnrollmentKeyboard(lang)
    });

    console.log(`✅ Enrollment completed for user ${telegramId}`);
}

/**
 * Handle batched AI chat (combines multiple quick messages)
 */
async function handleBatchedAIChat(bot, telegramId, text, user) {
    const lang = user.language || 'ro';

    // Get or create message queue for this user
    if (!messageBatchQueues.has(telegramId)) {
        messageBatchQueues.set(telegramId, []);
    }

    const queue = messageBatchQueues.get(telegramId);
    queue.push(text);

    console.log(`📨 Message added to queue for user ${telegramId}. Queue size: ${queue.length}`);

    // Clear existing timer
    if (messageBatchTimers.has(telegramId)) {
        clearTimeout(messageBatchTimers.get(telegramId));
    }

    // Set new timer (5 seconds by default)
    const timer = setTimeout(async () => {
        await processMessageBatch(bot, telegramId, user);
    }, config.bot.messageBatchTimeout);

    messageBatchTimers.set(telegramId, timer);
}

/**
 * Process batched messages and send to AI
 */
async function processMessageBatch(bot, telegramId, user) {
    const queue = messageBatchQueues.get(telegramId);

    if (!queue || queue.length === 0) {
        console.log('📨 No messages in queue');
        return;
    }

    const combinedMessage = queue.join('\n');
    console.log(`📨 Processing ${queue.length} batched messages for user ${telegramId}`);

    // Clear queue
    messageBatchQueues.set(telegramId, []);
    messageBatchTimers.delete(telegramId);

    const lang = user.language || 'ro';

    // Send "typing" action
    await bot.sendChatAction(telegramId, 'typing');

    try {
        // Build context from diagnostic and actions
        let context = '';

        // Add diagnostic info if available
        const diagnosticAnswers = diagnosticDb.getAnswers(telegramId);
        if (diagnosticAnswers.length > 0) {
            const diagnosticSummary = buildDiagnosticSummary(diagnosticAnswers, lang);
            context += lang === 'ru' ?
                '\n\nИнформация из диагностики:\n' + diagnosticSummary :
                '\n\nInformații din diagnostic:\n' + diagnosticSummary;
        }

        // Add action log
        const actions = actionLogDb.getRecent(telegramId, 20);
        const isAuthenticated = user.is_authenticated === 1;
        const actionNarrative = buildActionLogNarrative(actions, lang, isAuthenticated, user.phone || '');
        context += actionNarrative;

        // Get conversation history
        const history = conversationDb.getRecent(telegramId, 6);

        // Call AI
        const aiResponse = await callAI(combinedMessage, history, context, lang);

        // Add to conversation history
        conversationDb.add(telegramId, 'bot', aiResponse);

        // Send response
        await bot.sendMessage(telegramId, aiResponse);

        console.log(`✅ AI response sent to user ${telegramId}`);
    } catch (error) {
        console.error('❌ Error calling AI:', error.message);

        const errorText = lang === 'ru' ?
            `Извините, произошла ошибка: ${error.message}` :
            `Scuze, a apărut o eroare: ${error.message}`;

        await bot.sendMessage(telegramId, errorText);
    }
}
