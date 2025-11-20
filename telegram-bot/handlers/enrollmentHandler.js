// handlers/enrollmentHandler.js
import { userDb, enrollmentDb, actionLogDb } from '../database/db.js';

/**
 * Start enrollment flow
 */
export async function handleEnrollmentStart(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Log enrollment start
    actionLogDb.log(telegramId, 'enrollment_started', { step: 'starting' });

    // Check if user already has phone (from authentication)
    if (user.phone && user.is_authenticated === 1) {
        // Skip phone step - user already authenticated
        const metadata = user.metadata ? JSON.parse(user.metadata) : {};
        metadata.enrollment_phone = user.phone;

        userDb.update(telegramId, {
            current_state: 'enrollment_name',
            metadata: JSON.stringify(metadata)
        });

        const text = lang === 'ru' ?
            `🎉 Отлично! Используем твой номер: ${user.phone}\n\n📝 Теперь скажи, как тебя зовут?` :
            `🎉 Perfect! Folosim numărul tău: ${user.phone}\n\n📝 Acum spune-mi, cum te cheamă?`;

        await bot.sendMessage(telegramId, text);
    } else {
        // Ask for phone number
        userDb.update(telegramId, { current_state: 'enrollment_phone' });

        const text = lang === 'ru' ?
            '🎉 Отлично! Давай оформим твою заявку.\n\n📱 Для начала, оставь свой номер телефона:' :
            '🎉 Perfect! Hai să completăm cererea ta.\n\n📱 Pentru început, lasă numărul tău de telefon:';

        await bot.sendMessage(telegramId, text);
    }
}

/**
 * Handle enrollment skip email
 */
export async function handleEnrollmentSkipEmail(bot, telegramId) {
    const user = userDb.get(telegramId);
    const lang = user.language || 'ro';

    // Complete enrollment without email
    const metadata = user.metadata ? JSON.parse(user.metadata) : {};

    enrollmentDb.create(
        telegramId,
        metadata.enrollment_name || 'Unknown',
        metadata.enrollment_phone || user.phone || 'Unknown',
        null // no email
    );

    userDb.update(telegramId, { current_state: 'main_menu' });

    const text = lang === 'ru' ?
        `✅ Отлично! Заявка отправлена.\n\nНаш куратор свяжется с тобой в течение 24 часов.\n\nА пока можешь посмотреть бесплатный урок! 🎁` :
        `✅ Perfect! Cererea a fost trimisă.\n\nCuratorul nostru te va contacta în 24 de ore.\n\nÎntre timp, poți vedea lecția gratuită! 🎁`;

    const { getPostEnrollmentKeyboard } = await import('../utils/keyboards.js');

    await bot.sendMessage(telegramId, text, {
        reply_markup: getPostEnrollmentKeyboard(lang)
    });

    console.log(`✅ Enrollment completed for user ${telegramId} (no email)`);
}
