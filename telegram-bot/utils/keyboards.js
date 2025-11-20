// utils/keyboards.js

/**
 * Language selection keyboard
 */
export function getLanguageKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '🇷🇴 Română', callback_data: 'lang_ro' },
                { text: '🇷🇺 Русский', callback_data: 'lang_ru' }
            ]
        ]
    };
}

/**
 * Main menu keyboard
 */
export function getMainMenuKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '🔬 Диагностика' : '🔬 Diagnostic',
                    callback_data: 'menu_diagnostic'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '🎁 Бесплатный урок' : '🎁 Lecție gratuită',
                    callback_data: 'menu_lesson'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '📚 О программе' : '📚 Despre program',
                    callback_data: 'menu_program'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '❓ Задать вопрос' : '❓ Pune o întrebare',
                    callback_data: 'menu_question'
                }
            ]
        ]
    };
}

/**
 * Diagnostic intro keyboard
 */
export function getDiagnosticIntroKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '✅ Да, начинаем' : '✅ Da, începem',
                    callback_data: 'diagnostic_start'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '❓ Ещё вопросы' : '❓ Mai întâi întrebări',
                    callback_data: 'diagnostic_faq'
                }
            ]
        ]
    };
}

/**
 * Diagnostic question keyboard (with options)
 */
export function getDiagnosticQuestionKeyboard(options, questionNum) {
    return {
        inline_keyboard: options.map((option, idx) => [
            {
                text: option,
                callback_data: `diag_answer_${questionNum}_${idx}`
            }
        ])
    };
}

/**
 * Diagnostic results keyboard
 */
export function getDiagnosticResultsKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '📚 Да, расскажи о программе' : '📚 Da, spune-mi despre program',
                    callback_data: 'menu_program'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '📝 Записаться на программу' : '📝 Înscrie-te la program',
                    callback_data: 'enroll_start'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '💬 Связаться с куратором' : '💬 Contactează curatorul',
                    callback_data: 'contact_curator'
                }
            ]
        ]
    };
}

/**
 * Free lesson keyboard
 */
export function getFreeLessonKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '✅ Да, хочу урок' : '✅ Da, vreau lecția',
                    callback_data: 'lesson_send'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '⬅️ Назад в меню' : '⬅️ Înapoi la meniu',
                    callback_data: 'back_menu'
                }
            ]
        ]
    };
}

/**
 * Program info keyboard
 */
export function getProgramInfoKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '📝 Записаться' : '📝 Înscrie-te',
                    callback_data: 'enroll_start'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '💬 Задать вопрос' : '💬 Pune o întrebare',
                    callback_data: 'menu_question'
                }
            ]
        ]
    };
}

/**
 * Enrollment skip email keyboard
 */
export function getEnrollmentSkipEmailKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '➡️ Продолжить' : '➡️ Continuă',
                    callback_data: 'enroll_skip_email'
                }
            ]
        ]
    };
}

/**
 * Contact curator keyboard
 */
export function getContactCuratorKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '💬 Написать куратору' : '💬 Scrie curatorului',
                    url: 'https://t.me/oowell_support'
                }
            ],
            [
                {
                    text: lang === 'ru' ? '📞 Заказать звонок' : '📞 Solicită apel',
                    callback_data: 'request_callback'
                }
            ]
        ]
    };
}

/**
 * Post-enrollment keyboard
 */
export function getPostEnrollmentKeyboard(lang = 'ro') {
    return {
        inline_keyboard: [
            [
                {
                    text: lang === 'ru' ? '🎁 Получить урок' : '🎁 Primește lecția',
                    callback_data: 'menu_lesson'
                }
            ]
        ]
    };
}
