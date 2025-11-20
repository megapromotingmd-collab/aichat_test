// utils/ai.js
import axios from 'axios';
import { config } from '../config/config.js';

/**
 * Get default system prompt
 */
export function getDefaultSystemPrompt(lang = 'ro') {
    return lang === 'ru' ?
        `Ты — OO.WELL Bot, виртуальный помощник программы OO.WELL по женскому гормональному здоровью.

ЛИЧНОСТЬ:
- Теплая, эмпатичная, понимающая подруга
- Естественная в общении, не формальная
- Позитивная но реалистичная
- Объясняешь сложное просто
- АДАПТИРУЕШЬСЯ к стилю собеседницы

СТРОГИЕ ПРАВИЛА - НИКОГДА НЕ:
❌ Ставить медицинские диагнозы
❌ Назначать лечение или дозы препаратов
❌ Заменять врача
❌ Использовать давление для продажи
❌ Копировать шаблонные ответы (каждый ответ УНИКАЛЬНЫЙ!)
❌ Повторять фразы типа "Привет! Кажется, ты случайно написала..."
❌ Игнорировать бессмысленные сообщения - реагируй с юмором или переводи на тему здоровья

СТРОГИЕ ПРАВИЛА - ВСЕГДА:
✅ Говорить о "возможных дисбалансах"
✅ При серьезных симптомах — срочно к врачу
✅ Быть эмпатичной к опыту собеседницы
✅ Давать научно обоснованную информацию
✅ Персонализировать ответы на основе контекста
✅ Отвечать кратко (2-3 предложения)
✅ Если сообщение бессмысленное - реагировать естественно, с легким юмором
✅ Продолжать разговор естественно, не заставлять возвращаться в меню
✅ НЕ салютовать каждый раз "Привет!" - это РАЗГОВОР, не начало!
✅ НЕ ИСПОЛЬЗОВАТЬ markdown ** вообще - только обычный текст!
✅ ПОНИМАТЬ КОНТЕКСТ КНОПОК: когда пользователь нажимал кнопки (🔬 Diagnostic, 📚 O программе, etc), ты видишь это в истории действий
✅ ОБЪЕДИНЯТЬ НЕСКОЛЬКО СООБЩЕНИЙ: если пользователь отправил 2-3 сообщения подряд быстро, они объединены в одно - воспринимай как целостную мысль

ПРОГРАММА OO.WELL:
- 6 недель к гормональному балансу
- 12 видео-уроков (кортизол, эстроген, прогестерон, щитовидная железа, инсулин)
- Личный дневник симптомов
- Чек-листы и трекеры
- Поддержка кураторов
- Закрытое комьюнити
- Цена: €197
- Старт: 25 ноября

Всегда предлагай пройти бесплатную диагностику (10 вопросов, 5 минут) - но естественно, не навязчиво.` :
        `Ești OO.WELL Bot, asistentul virtual al programului OO.WELL pentru sănătatea hormonală feminină.

PERSONALITATE:
- Caldă, empatică, înțelegătoare ca o prietenă
- Naturală în comunicare, nu formală
- Pozitivă dar realistă
- Explici complex într-un mod simplu
- TE ADAPTEZI la stilul persoanei

REGULI STRICTE - NICIODATĂ NU:
❌ Pui diagnostice medicale
❌ Prescrii tratamente sau doze
❌ Înlocuiești medicul
❌ Folosești presiune pentru vânzare
❌ Copiezi răspunsuri generice (fiecare răspuns UNIC!)
❌ Repeți fraze de tipul "Se pare că ai scris ceva din greșeală..."
❌ Ignori mesaje fără sens - reacționează cu umor sau redirectează spre sănătate

REGULI STRICTE - ÎNTOTDEAUNA:
✅ Vorbești despre "posibile dezechilibre"
✅ La simptome severe → urgent la medic
✅ Fii empatică cu experiența ei
✅ Informații bazate pe știință
✅ Personalizează răspunsurile pe baza contextului
✅ Răspunde scurt (2-3 propoziții)
✅ Dacă mesajul e fără sens - reacționează natural, cu umor ușor
✅ Continuă conversația natural, nu forța întoarcerea la meniu
✅ NU saluta de fiecare dată "Bună!" - e CONVERSAȚIE, nu început!
✅ NU FOLOSI deloc markdown ** - doar text normal!
✅ ÎNȚELEGE CONTEXTUL BUTOANELOR: când utilizatorul a apăsat butoane (🔬 Diagnostic, 📚 Despre program, etc), vezi asta în istoricul acțiunilor
✅ COMBINĂ MESAJE MULTIPLE: dacă utilizatorul a trimis 2-3 mesaje rapid consecutiv, sunt combinate într-unul - percepe ca gândire unitară

PROGRAMUL OO.WELL:
- 6 săptămâni către echilibru hormonal
- 12 lecții video (cortizol, estrogen, progesteron, tiroidă, insulină)
- Jurnal personal de simptome
- Checklist-uri și trackere
- Suport curatori
- Comunitate închisă
- Preț: €197
- Start: 25 noiembrie

Întotdeauna propune diagnosticul gratuit (10 întrebări, 5 minute) - dar natural, nu insistent.`;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages) {
    if (!config.ai.openaiKey) {
        throw new Error('OpenAI API Key missing');
    }

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.8,
            max_tokens: 350
        },
        {
            headers: {
                'Authorization': `Bearer ${config.ai.openaiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

/**
 * Call Groq API
 */
async function callGroqAPI(messages) {
    if (!config.ai.groqKey) {
        throw new Error('Groq API Key missing');
    }

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.8,
            max_completion_tokens: 350,
            top_p: 0.95
        },
        {
            headers: {
                'Authorization': `Bearer ${config.ai.groqKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

/**
 * Main AI function - routes to appropriate provider
 */
export async function callAI(userMessage, conversationHistory = [], context = '', lang = 'ro') {
    try {
        // Build system prompt
        let systemPrompt = getDefaultSystemPrompt(lang);

        // Add context if available
        if (context) {
            systemPrompt += '\n\n' + context;
        }

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history (last 6 messages for context)
        const recentHistory = conversationHistory.slice(-6);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.message
            });
        });

        // Add current message if not already in history
        const lastMsg = recentHistory[recentHistory.length - 1];
        if (!lastMsg || lastMsg.message !== userMessage) {
            messages.push({
                role: 'user',
                content: userMessage
            });
        }

        // Route to appropriate AI provider
        if (config.ai.provider === 'openai') {
            return await callOpenAI(messages);
        } else {
            return await callGroqAPI(messages);
        }
    } catch (error) {
        console.error('❌ AI Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Build action log narrative for AI context
 */
export function buildActionLogNarrative(actions, lang = 'ro', isAuthenticated = false, userPhone = '') {
    if (actions.length === 0) return '';

    let narrative = lang === 'ru' ?
        '\n\n📋 ИСТОРИЯ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ (ты должна знать об этом):\n' :
        '\n\n📋 ISTORICUL ACȚIUNILOR UTILIZATORULUI (trebuie să știi asta):\n';

    // Take last 20 actions
    const recentActions = actions.slice(-20);

    recentActions.forEach(action => {
        const actionData = typeof action.action_data === 'string'
            ? JSON.parse(action.action_data)
            : action.action_data;

        const time = new Date(action.timestamp).toLocaleTimeString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (action.action_type === 'language_select') {
            const langName = actionData.language === 'ru' ? 'Русский' : 'Română';
            narrative += lang === 'ru' ?
                `[${time}] Пользователь выбрал язык: ${langName}\n` :
                `[${time}] Utilizatorul a selectat limba: ${langName}\n`;
        } else if (action.action_type === 'button_click') {
            narrative += lang === 'ru' ?
                `[${time}] Пользователь нажал кнопку: ${actionData.buttonText}\n` :
                `[${time}] Utilizatorul a apăsat butonul: ${actionData.buttonText}\n`;
        } else if (action.action_type === 'diagnostic_answer') {
            narrative += lang === 'ru' ?
                `[${time}] Вопрос ${actionData.questionNum}/10: ${actionData.answer}\n` :
                `[${time}] Întrebarea ${actionData.questionNum}/10: ${actionData.answer}\n`;
        } else if (action.action_type === 'diagnostic_started') {
            narrative += lang === 'ru' ?
                `[${time}] ✅ Пользователь начал диагностику\n` :
                `[${time}] ✅ Utilizatorul a început diagnosticul\n`;
        } else if (action.action_type === 'diagnostic_completed') {
            narrative += lang === 'ru' ?
                `[${time}] ✅ Диагностика завершена (10/10 вопросов)\n` :
                `[${time}] ✅ Diagnostic finalizat (10/10 întrebări)\n`;
        }
    });

    // Add authentication status context
    if (!isAuthenticated) {
        narrative += lang === 'ru' ?
            '\n\n⚠️ СТАТУС ПОЛЬЗОВАТЕЛЯ: НЕ АВТОРИЗОВАН\n' +
            'Пользователь еще НЕ ввел свой номер телефона и НЕ имеет доступа к полной программе.\n' +
            'Ты можешь отвечать на общие вопросы, но напомни о необходимости регистрации для доступа к программе.\n' :
            '\n\n⚠️ STATUS UTILIZATOR: NEAUTENTIFICAT\n' +
            'Utilizatorul NU și-a introdus încă numărul de telefon și NU are acces la programul complet.\n' +
            'Poți răspunde la întrebări generale, dar amintește-i despre necesitatea înregistrării pentru acces la program.\n';
    } else {
        narrative += lang === 'ru' ?
            `\n\n✅ СТАТУС ПОЛЬЗОВАТЕЛЯ: АВТОРИЗОВАН (${userPhone})\n` +
            'Пользователь зарегистрирован и имеет полный доступ к программе.\n' :
            `\n\n✅ STATUS UTILIZATOR: AUTENTIFICAT (${userPhone})\n` +
            'Utilizatorul este înregistrat și are acces complet la program.\n';
    }

    narrative += lang === 'ru' ?
        '\n⚠️ ВАЖНО: Ты ВИДИШЬ всю историю действий выше. Используй её для персонализированного ответа!\n' :
        '\n⚠️ IMPORTANT: TU VEZI tot istoricul acțiunilor de mai sus. Folosește-l pentru răspuns personalizat!\n';

    return narrative;
}
