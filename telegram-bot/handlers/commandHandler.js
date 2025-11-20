// handlers/commandHandler.js
import { userDb, actionLogDb } from '../database/db.js';
import { getLanguageKeyboard, getMainMenuKeyboard } from '../utils/keyboards.js';

/**
 * Handle /start command
 */
export async function handleStartCommand(bot, msg) {
    const telegramId = msg.from.id;

    // Get or create user
    const user = userDb.getOrCreate(telegramId, msg.from);

    console.log(`👋 /start command from ${user.first_name || 'User'} (${telegramId})`);

    // Check if already authenticated
    if (user.is_authenticated === 1 && user.language) {
        // User already authenticated - show main menu
        await showMainMenu(bot, telegramId);
    } else {
        // Show language selection
        await showLanguageSelection(bot, telegramId);
    }
}

/**
 * Show language selection
 */
export async function showLanguageSelection(bot, telegramId) {
    const text = 'Bună! 👋 | Привет! 👋\n\nAlege limba / Выбери язык:';

    await bot.sendMessage(telegramId, text, {
        reply_markup: getLanguageKeyboard()
    });
}

/**
 * Handle language selection
 */
export async function handleLanguageSelection(bot, telegramId, lang) {
    // Update user language
    userDb.update(telegramId, { language: lang });

    // Log action
    actionLogDb.log(telegramId, 'language_select', { language: lang });

    console.log(`🌍 User ${telegramId} selected language: ${lang}`);

    // Check if already authenticated
    const user = userDb.get(telegramId);

    if (user.is_authenticated === 1 && user.phone) {
        // Already authenticated - go to main menu
        await showMainMenu(bot, telegramId);
    } else {
        // Request phone number
        await requestPhoneNumber(bot, telegramId, lang);
    }
}

/**
 * Request phone number for authentication
 */
export async function requestPhoneNumber(bot, telegramId, lang) {
    userDb.update(telegramId, { current_state: 'phone_verification' });

    const text = lang === 'ru' ?
        `🔐 Для доступа к программе, пожалуйста, введи свой номер телефона.\n\n📱 Формат: 069123456 (без пробелов)\n\n⚠️ Доступ имеют только зарегистрированные участники.` :
        `🔐 Pentru acces la program, te rog introdu numărul tău de telefon.\n\n📱 Format: 069123456 (fără spații)\n\n⚠️ Acces doar pentru participanți înregistrați.`;

    await bot.sendMessage(telegramId, text);
}

/**
 * Show main menu
 */
export async function showMainMenu(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    userDb.update(telegramId, { current_state: 'main_menu' });

    const welcomeText = lang === 'ru' ?
        `Привет! 👋\n\nЯ — виртуальный помощник программы OO.WELL по женскому гормональному здоровью.\n\nЯ могу помочь тебе:\n🔬 Пройти бесплатную диагностику\n🎁 Получить бесплатный урок\n📚 Узнать о программе\n💬 Ответить на вопросы\n\nЧто тебя интересует?` :
        `Bună! 👋\n\nSunt asistentul virtual al programului OO.WELL pentru sănătatea hormonală feminină.\n\nTe pot ajuta să:\n🔬 Faci un diagnostic gratuit\n🎁 Primești o lecție gratuită\n📚 Afli despre program\n💬 Răspund la întrebări\n\nCe te interesează?`;

    await bot.sendMessage(telegramId, welcomeText, {
        reply_markup: getMainMenuKeyboard(lang)
    });
}

/**
 * Show program info
 */
export async function showProgramInfo(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'navigation', { destination: 'program_info' });

    const text = lang === 'ru' ?
        '📚 Программа OO.WELL\n\n6 недель к гормональному балансу\n\nЧто входит:\n• 12 видео-уроков\n• Личный дневник симптомов\n• Чек-листы и трекеры\n• Поддержка кураторов\n• Доступ в закрытое комьюнити\n\nМодули:\n1. Основы гормонов\n2. Кортизол и стресс\n3. Эстроген и прогестерон\n4. Щитовидная железа\n5. Питание\n6. Образ жизни\n\n💰 Инвестиция: €197\n\n🚀 Старт: 25 ноября' :
        '📚 Programul OO.WELL\n\n6 săptămâni către echilibru hormonal\n\nCe include:\n• 12 lecții video\n• Jurnal personal de simptome\n• Checklist-uri și trackere\n• Suport curatori\n• Acces în comunitatea închisă\n\nModule:\n1. Bazele hormonilor\n2. Cortizol și stress\n3. Estrogen și progesteron\n4. Tiroida\n5. Nutriție\n6. Stil de viață\n\n💰 Investiție: €197\n\n🚀 Start: 25 noiembrie';

    const { getProgramInfoKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, text, {
        reply_markup: getProgramInfoKeyboard(lang)
    });
}

/**
 * Handle free lesson request
 */
export async function handleFreeLessonRequest(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'navigation', { destination: 'free_lesson' });

    const text = lang === 'ru' ?
        '🎁 Бесплатный урок "Основы гормонального здоровья"\n\nТы получишь:\n✅ Видео-урок (30 минут)\n✅ Чек-лист здоровых привычек\n✅ Гид по симптомам\n\nУрок будет доступен 24 часа.\n\nОтправить тебе доступ?' :
        '🎁 Lecție gratuită "Bazele sănătății hormonale"\n\nVei primi:\n✅ Video lecție (30 minute)\n✅ Checklist de obiceiuri sănătoase\n✅ Ghid de simptome\n\nLecția va fi disponibilă 24 ore.\n\nÎți trimit accesul?';

    const { getFreeLessonKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, text, {
        reply_markup: getFreeLessonKeyboard(lang)
    });
}

/**
 * Send free lesson
 */
export async function sendFreeLesson(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'action', { action: 'free_lesson_requested' });

    const text = lang === 'ru' ?
        '🎉 Отлично! Вот твой доступ:\n\n🔗 https://oowell.md/free-lesson\n\n⏰ Урок будет доступен до завтра в это же время.\n\nПосле просмотра обязательно напиши мне, что ты узнала нового! 😊' :
        '🎉 Perfect! Iată accesul tău:\n\n🔗 https://oowell.md/free-lesson\n\n⏰ Lecția va fi disponibilă până mâine la aceeași oră.\n\nDupă vizionare, scrie-mi neapărat ce ai învățat nou! 😊';

    await bot.sendMessage(telegramId, text);
}

/**
 * Ask question mode
 */
export async function handleAskQuestion(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'navigation', { destination: 'ask_question' });

    userDb.update(telegramId, { current_state: 'ask_question' });

    const text = lang === 'ru' ?
        '💬 Задай мне любой вопрос о гормональном здоровье или программе.\n\nЯ постараюсь помочь! 😊' :
        '💬 Pune-mi orice întrebare despre sănătatea hormonală sau program.\n\nÎncerc să te ajut! 😊';

    await bot.sendMessage(telegramId, text);
}

/**
 * Contact curator
 */
export async function handleContactCurator(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'navigation', { destination: 'contact_curator' });

    const text = lang === 'ru' ?
        '👥 Связь с куратором\n\nЯ — бот, который отвечает на базовые вопросы.\n\nДля более сложных вопросов я могу соединить тебя с куратором из команды OO.WELL.\n\nВыбери:' :
        '👥 Contact curator\n\nEu sunt un bot care răspunde la întrebări de bază.\n\nPentru întrebări mai complexe te pot conecta cu un curator din echipa OO.WELL.\n\nAlege:';

    const { getContactCuratorKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, text, {
        reply_markup: getContactCuratorKeyboard(lang)
    });
}

/**
 * Request callback
 */
export async function handleRequestCallback(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log action
    actionLogDb.log(telegramId, 'action', { action: 'callback_requested' });

    const text = lang === 'ru' ?
        '📞 Заявка на звонок отправлена!\n\nКуратор свяжется с тобой в ближайшее время.' :
        '📞 Cererea de apel a fost trimisă!\n\nCuratorul te va contacta în curând.';

    await bot.sendMessage(telegramId, text);

    console.log(`📞 Callback requested by user ${telegramId}`);
}
