// handlers/diagnosticHandler.js
import { userDb, diagnosticDb, actionLogDb, conversationDb } from '../database/db.js';
import {
    diagnosticQuestions,
    getAnswerScore,
    analyzeDiagnostic,
    buildDiagnosticSummary
} from '../utils/diagnostic.js';
import {
    getDiagnosticIntroKeyboard,
    getDiagnosticQuestionKeyboard,
    getDiagnosticResultsKeyboard
} from '../utils/keyboards.js';
import { callAI } from '../utils/ai.js';

/**
 * Start diagnostic intro
 */
export async function startDiagnosticIntro(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    userDb.update(telegramId, { current_state: 'diagnostic_intro' });

    // Log action
    actionLogDb.log(telegramId, 'navigation', { destination: 'diagnostic_intro' });

    const text = lang === 'ru' ?
        '🔬 Диагностика гормонального здоровья\n\nЯ задам тебе 10 вопросов о твоем самочувствии.\nЭто займет 5-7 минут.\n\nПосле этого ты узнаешь, какие гормоны могут быть в дисбалансе.\n\n⚠️ Важно: это не медицинский диагноз, а предварительная оценка.\n\nГотова начать?' :
        '🔬 Diagnostic de sănătate hormonală\n\nÎți voi pune 10 întrebări despre starea ta.\nVa dura 5-7 minute.\n\nDupă aceea vei afla ce hormoni ar putea fi în dezechilibru.\n\n⚠️ Important: acesta nu este un diagnostic medical, ci o evaluare preliminară.\n\nEști gata să începem?';

    await bot.sendMessage(telegramId, text, {
        reply_markup: getDiagnosticIntroKeyboard(lang)
    });
}

/**
 * Show diagnostic FAQ
 */
export async function showDiagnosticFAQ(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    const text = lang === 'ru' ?
        'Часто задаваемые вопросы:\n\n❓ Это безопасно?\nДа, вся информация конфиденциальна.\n\n❓ Это медицинский диагноз?\nНет, это предварительная оценка. Для точного диагноза обратись к врачу.\n\n❓ Сколько времени займет?\n5-7 минут.\n\nГотова начать?' :
        'Întrebări frecvente:\n\n❓ Este sigur?\nDa, toate informațiile sunt confidențiale.\n\n❓ Este un diagnostic medical?\nNu, e o evaluare preliminară. Pentru diagnostic precis, consultă medicul.\n\n❓ Cât durează?\n5-7 minute.\n\nEști gata să începem?';

    await bot.sendMessage(telegramId, text, {
        reply_markup: getDiagnosticIntroKeyboard(lang)
    });
}

/**
 * Start diagnostic (first question)
 */
export async function startDiagnostic(bot, telegramId) {
    const user = userDb.get(telegramId);

    // Clear previous diagnostic if exists
    diagnosticDb.clear(telegramId);

    // Log diagnostic start
    actionLogDb.log(telegramId, 'diagnostic_started', { totalQuestions: 10 });

    // Show first question
    await showDiagnosticQuestion(bot, telegramId, 1);
}

/**
 * Show diagnostic question
 */
export async function showDiagnosticQuestion(bot, telegramId, questionNum) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    userDb.update(telegramId, { current_state: `diagnostic_q${questionNum}` });

    const questions = diagnosticQuestions[lang];
    const question = questions[questionNum - 1];

    // Progress bar
    const progressBar = '▓'.repeat(questionNum) + '░'.repeat(10 - questionNum);

    // Options text
    const optionsText = question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');

    const text = `${lang === 'ru' ? 'Вопрос' : 'Întrebarea'} ${questionNum}/10\n${progressBar}\n\n${question.text}\n\n${optionsText}\n\n${lang === 'ru' ? 'Ты можешь ответить текстом или нажать кнопку:' : 'Poți răspunde cu text sau apăsând butonul:'}`;

    await bot.sendMessage(telegramId, text, {
        reply_markup: getDiagnosticQuestionKeyboard(question.options, questionNum)
    });
}

/**
 * Handle diagnostic answer (from button)
 */
export async function handleDiagnosticAnswer(bot, telegramId, questionNum, answerIndex) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    const questions = diagnosticQuestions[lang];
    const question = questions[questionNum - 1];
    const answer = question.options[answerIndex];

    // Save answer
    const score = getAnswerScore(answer, lang);
    diagnosticDb.saveAnswer(telegramId, questionNum, answer, score);

    // Log action
    actionLogDb.log(telegramId, 'diagnostic_answer', {
        questionNum: questionNum,
        answer: answer,
        fromButton: true
    });

    console.log(`📝 User ${telegramId} answered Q${questionNum}: ${answer} (score: ${score})`);

    // Move to next question or show results
    if (questionNum < 10) {
        setTimeout(async () => {
            await showDiagnosticQuestion(bot, telegramId, questionNum + 1);
        }, 500);
    } else {
        // Diagnostic complete
        actionLogDb.log(telegramId, 'diagnostic_completed', { totalAnswers: 10 });

        setTimeout(async () => {
            await showDiagnosticResults(bot, telegramId);
        }, 800);
    }
}

/**
 * Show diagnostic results with AI analysis
 */
export async function showDiagnosticResults(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    userDb.update(telegramId, { current_state: 'diagnostic_results' });

    // Send "typing" action
    await bot.sendChatAction(telegramId, 'typing');

    try {
        // Get all answers
        const answers = diagnosticDb.getAnswers(telegramId);

        // Build diagnostic summary for AI
        const diagnosticSummary = buildDiagnosticSummary(answers, lang);

        // AI prompt for personalized verdict
        const verdictPrompt = lang === 'ru' ?
            `${diagnosticSummary}\n\nТЫ ДОЛЖНА:\n1. Проанализировать ответы\n2. Определить ВОЗМОЖНЫЕ гормональные дисбалансы (кортизол, эстроген, прогестерон, тироида, инсулин)\n3. Дать ПЕРСОНАЛИЗИРОВАННЫЙ, эмпатичный вердикт (4-6 предложений)\n4. Упомянуть конкретные симптомы из ответов\n5. ОБЯЗАТЕЛЬНО написать что это НЕ медицинский диагноз\n6. Предложить программу OO.WELL для решения этих проблем\n7. НЕ ИСПОЛЬЗОВАТЬ markdown ** - пиши обычным текстом!\n\nФормат ответа:\n✅ Диагностика завершена!\n\n[Твой персонализированный анализ здесь...]\n\n⚠️ Важно: это не медицинский диагноз, а предварительная оценка.\n\n📚 Программа OO.WELL поможет...` :
            `${diagnosticSummary}\n\nTREBUIE SĂ:\n1. Analizezi răspunsurile\n2. Identifici POSIBILE dezechilibre hormonale (cortizol, estrogen, progesteron, tiroidă, insulină)\n3. Dai un VERDICT PERSONALIZAT, empatic (4-6 propoziții)\n4. Menționezi simptomele concrete din răspunsuri\n5. OBLIGATORIU să scrii că NU este diagnostic medical\n6. Propui programul OO.WELL pentru rezolvarea problemelor\n7. NU FOLOSI markdown ** - scrie text normal!\n\nFormat răspuns:\n✅ Diagnostic finalizat!\n\n[Analiza ta personalizată aici...]\n\n⚠️ Important: acesta nu este un diagnostic medical, ci o evaluare preliminară.\n\n📚 Programul OO.WELL te va ajuta...`;

        // Call AI for verdict
        const aiVerdict = await callAI(verdictPrompt, [], '', lang);

        // Add to conversation history
        conversationDb.add(telegramId, 'bot', aiVerdict);

        // Send response
        await bot.sendMessage(telegramId, aiVerdict, {
            reply_markup: getDiagnosticResultsKeyboard(lang)
        });

        console.log(`✅ Diagnostic results sent to user ${telegramId}`);
    } catch (error) {
        console.error('❌ Error generating AI verdict:', error.message);

        // Fallback to simple analysis
        const answers = diagnosticDb.getAnswers(telegramId);
        const results = analyzeDiagnostic(answers, lang);

        const text = lang === 'ru' ?
            `✅ Диагностика завершена!\n\nНа основе твоих ответов, возможные дисбалансы:\n\n${results.map(r => `🔸 ${r}`).join('\n')}\n\n⚠️ Это предварительная оценка. Для точного диагноза обратись к врачу.\n\n📚 Хочешь узнать, как программа OO.WELL может помочь?` :
            `✅ Diagnostic finalizat!\n\nPe baza răspunsurilor tale, posibile dezechilibre:\n\n${results.map(r => `🔸 ${r}`).join('\n')}\n\n⚠️ Aceasta este o evaluare preliminară. Pentru un diagnostic precis, consultă un medic.\n\n📚 Vrei să afli cum te poate ajuta programul OO.WELL?`;

        await bot.sendMessage(telegramId, text, {
            reply_markup: getDiagnosticResultsKeyboard(lang)
        });
    }
}
