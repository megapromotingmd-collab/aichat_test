// handlers/callbackHandler.js
import { userDb, actionLogDb } from '../database/db.js';
import {
    handleLanguageSelection,
    showMainMenu,
    showProgramInfo,
    handleFreeLessonRequest,
    sendFreeLesson,
    handleAskQuestion,
    handleContactCurator,
    handleRequestCallback
} from './commandHandler.js';
import {
    startDiagnosticIntro,
    showDiagnosticFAQ,
    startDiagnostic,
    handleDiagnosticAnswer
} from './diagnosticHandler.js';
import { handleEnrollmentStart, handleEnrollmentSkipEmail } from './enrollmentHandler.js';

/**
 * Handle callback queries (button clicks)
 */
export async function handleCallbackQuery(bot, query) {
    const telegramId = query.from.id;
    const data = query.callback_data;

    console.log(`🔘 Callback from ${telegramId}: ${data}`);

    // Answer callback query to remove "loading" spinner
    await bot.answerCallbackQuery(query.id);

    // Get user
    const user = userDb.get(telegramId);
    const lang = user?.language || 'ro';

    // Log button click
    const buttonText = query.message?.reply_markup?.inline_keyboard
        ?.flat()
        ?.find(btn => btn.callback_data === data)
        ?.text || data;

    actionLogDb.log(telegramId, 'button_click', { buttonText: buttonText });

    // Route callback to appropriate handler
    try {
        // Language selection
        if (data === 'lang_ro' || data === 'lang_ru') {
            const selectedLang = data === 'lang_ro' ? 'ro' : 'ru';
            await handleLanguageSelection(bot, telegramId, selectedLang);
        }
        // Main menu
        else if (data === 'back_menu') {
            await showMainMenu(bot, telegramId);
        }
        // Menu - Diagnostic
        else if (data === 'menu_diagnostic') {
            await startDiagnosticIntro(bot, telegramId);
        }
        // Menu - Free Lesson
        else if (data === 'menu_lesson') {
            await handleFreeLessonRequest(bot, telegramId);
        }
        // Menu - Program Info
        else if (data === 'menu_program') {
            await showProgramInfo(bot, telegramId);
        }
        // Menu - Ask Question
        else if (data === 'menu_question') {
            await handleAskQuestion(bot, telegramId);
        }
        // Diagnostic - Start
        else if (data === 'diagnostic_start') {
            await startDiagnostic(bot, telegramId);
        }
        // Diagnostic - FAQ
        else if (data === 'diagnostic_faq') {
            await showDiagnosticFAQ(bot, telegramId);
        }
        // Diagnostic - Answer (format: diag_answer_QNUM_OPTIONIDX)
        else if (data.startsWith('diag_answer_')) {
            const parts = data.split('_');
            const questionNum = parseInt(parts[2]);
            const answerIndex = parseInt(parts[3]);
            await handleDiagnosticAnswer(bot, telegramId, questionNum, answerIndex);
        }
        // Enrollment - Start
        else if (data === 'enroll_start') {
            await handleEnrollmentStart(bot, telegramId);
        }
        // Enrollment - Skip Email
        else if (data === 'enroll_skip_email') {
            await handleEnrollmentSkipEmail(bot, telegramId);
        }
        // Free Lesson - Send
        else if (data === 'lesson_send') {
            await sendFreeLesson(bot, telegramId);
        }
        // Contact Curator
        else if (data === 'contact_curator') {
            await handleContactCurator(bot, telegramId);
        }
        // Request Callback
        else if (data === 'request_callback') {
            await handleRequestCallback(bot, telegramId);
        }
        // Unknown callback
        else {
            console.warn(`⚠️ Unknown callback data: ${data}`);
        }
    } catch (error) {
        console.error('❌ Error handling callback:', error.message);

        const errorText = lang === 'ru' ?
            'Произошла ошибка. Попробуй еще раз.' :
            'A apărut o eroare. Încearcă din nou.';

        await bot.sendMessage(telegramId, errorText);
    }
}
