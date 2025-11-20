// utils/diagnostic.js

/**
 * Diagnostic questions in both languages
 */
export const diagnosticQuestions = {
    ru: [
        {
            id: 1,
            text: "Как часто ты чувствуешь усталость даже после сна?",
            options: ["Редко", "Иногда", "Часто", "Постоянно"]
        },
        {
            id: 2,
            text: "Были ли у тебя резкие изменения веса за последние 3 месяца?",
            options: ["Нет", "Набрала вес", "Похудела", "Вес скачет"]
        },
        {
            id: 3,
            text: "Как бы ты оценила свой уровень стресса?",
            options: ["Низкий", "Средний", "Высокий", "Очень высокий"]
        },
        {
            id: 4,
            text: "Есть ли проблемы со сном?",
            options: ["Нет", "Засыпаю плохо", "Просыпаюсь ночью", "Оба варианта"]
        },
        {
            id: 5,
            text: "Как часто бывают перепады настроения?",
            options: ["Редко", "Иногда", "Часто", "Очень часто"]
        },
        {
            id: 6,
            text: "Есть ли проблемы с менструальным циклом?",
            options: ["Нет", "Нерегулярный", "Болезненный", "Оба варианта"]
        },
        {
            id: 7,
            text: "Замечаешь ли проблемы с кожей (акне, сухость)?",
            options: ["Нет", "Легкие", "Умеренные", "Серьезные"]
        },
        {
            id: 8,
            text: "Как с либидо?",
            options: ["Нормально", "Снижено", "Очень низкое", "Отсутствует"]
        },
        {
            id: 9,
            text: "Есть ли проблемы с концентрацией и памятью?",
            options: ["Нет", "Иногда", "Часто", "Постоянно"]
        },
        {
            id: 10,
            text: "Чувствуешь ли тревожность без причины?",
            options: ["Редко", "Иногда", "Часто", "Постоянно"]
        }
    ],
    ro: [
        {
            id: 1,
            text: "Cât de des te simți obosită chiar și după somn?",
            options: ["Rar", "Uneori", "Des", "Constant"]
        },
        {
            id: 2,
            text: "Ai avut schimbări bruște de greutate în ultimele 3 luni?",
            options: ["Nu", "Am luat în greutate", "Am slăbit", "Greutatea fluctuează"]
        },
        {
            id: 3,
            text: "Cum ai evalua nivelul tău de stress?",
            options: ["Scăzut", "Mediu", "Ridicat", "Foarte ridicat"]
        },
        {
            id: 4,
            text: "Ai probleme cu somnul?",
            options: ["Nu", "Adorm greu", "Mă trezesc noaptea", "Ambele"]
        },
        {
            id: 5,
            text: "Cât de des ai schimbări de dispoziție?",
            options: ["Rar", "Uneori", "Des", "Foarte des"]
        },
        {
            id: 6,
            text: "Ai probleme cu ciclul menstrual?",
            options: ["Nu", "Neregulat", "Dureros", "Ambele"]
        },
        {
            id: 7,
            text: "Observi probleme cu pielea (acnee, uscăciune)?",
            options: ["Nu", "Ușoare", "Moderate", "Serioase"]
        },
        {
            id: 8,
            text: "Cum e libidoul tău?",
            options: ["Normal", "Scăzut", "Foarte scăzut", "Absent"]
        },
        {
            id: 9,
            text: "Ai probleme cu concentrarea și memoria?",
            options: ["Nu", "Uneori", "Des", "Constant"]
        },
        {
            id: 10,
            text: "Simți anxietate fără motiv?",
            options: ["Rar", "Uneori", "Des", "Constant"]
        }
    ]
};

/**
 * Get score for answer
 */
export function getAnswerScore(answer, lang) {
    const scoreMapping = {
        ru: {
            'Редко': 0, 'Нет': 0, 'Низкий': 0, 'Нормально': 0,
            'Иногда': 1, 'Легкие': 1, 'Средний': 1, 'Снижено': 1, 'Набрала вес': 1, 'Похудела': 1,
            'Часто': 2, 'Умеренные': 2, 'Высокий': 2, 'Очень низкое': 2, 'Нерегулярный': 2, 'Болезненный': 2, 'Засыпаю плохо': 2, 'Просыпаюсь ночью': 2,
            'Постоянно': 3, 'Серьезные': 3, 'Очень высокий': 3, 'Отсутствует': 3, 'Вес скачет': 3, 'Оба варианта': 3, 'Очень часто': 3
        },
        ro: {
            'Rar': 0, 'Nu': 0, 'Scăzut': 0, 'Normal': 0,
            'Uneori': 1, 'Ușoare': 1, 'Mediu': 1, 'Am luat în greutate': 1, 'Am slăbit': 1,
            'Des': 2, 'Moderate': 2, 'Ridicat': 2, 'Foarte scăzut': 2, 'Neregulat': 2, 'Dureros': 2, 'Adorm greu': 2, 'Mă trezesc noaptea': 2,
            'Constant': 3, 'Serioase': 3, 'Foarte ridicat': 3, 'Absent': 3, 'Greutatea fluctuează': 3, 'Ambele': 3, 'Foarte des': 3
        }
    };

    return scoreMapping[lang]?.[answer] || 0;
}

/**
 * Analyze diagnostic results
 */
export function analyzeDiagnostic(answers, lang) {
    const scores = { cortisol: 0, estrogen: 0, progesterone: 0, thyroid: 0 };

    answers.forEach(answer => {
        const qId = answer.question_num;
        const score = answer.score;

        // Map questions to hormones
        if ([1, 3, 9].includes(qId)) scores.cortisol += score;
        if ([2, 6, 7].includes(qId)) scores.estrogen += score;
        if ([4, 5, 10].includes(qId)) scores.progesterone += score;
        if ([1, 2, 8].includes(qId)) scores.thyroid += score;
    });

    const results = [];
    if (scores.cortisol >= 4) results.push(lang === 'ru' ? 'Кортизол (гормон стресса)' : 'Cortizol (hormon de stress)');
    if (scores.estrogen >= 4) results.push(lang === 'ru' ? 'Эстроген' : 'Estrogen');
    if (scores.progesterone >= 4) results.push(lang === 'ru' ? 'Прогестерон' : 'Progesteron');
    if (scores.thyroid >= 4) results.push(lang === 'ru' ? 'Гормоны щитовидной железы' : 'Hormoni tiroidieni');

    return results.length > 0 ? results : [lang === 'ru' ? '✅ Все показатели в норме' : '✅ Totul pare normal'];
}

/**
 * Build diagnostic summary for AI
 */
export function buildDiagnosticSummary(answers, lang) {
    const questions = diagnosticQuestions[lang];
    let summary = lang === 'ru' ?
        'Вот результаты диагностики пользователя:\n\n' :
        'Iată rezultatele diagnosticului utilizatorului:\n\n';

    answers.forEach(answer => {
        const question = questions[answer.question_num - 1];
        summary += `${answer.question_num}. ${question.text}\nОтвет: ${answer.answer}\n\n`;
    });

    return summary;
}
