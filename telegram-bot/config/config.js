// config/config.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
    },
    ai: {
        provider: process.env.AI_PROVIDER || 'openai',
        openaiKey: process.env.OPENAI_API_KEY,
        groqKey: process.env.GROQ_API_KEY,
    },
    database: {
        path: process.env.DATABASE_PATH || './database/oowell.db',
    },
    auth: {
        authorizedPhones: (process.env.AUTHORIZED_PHONES || '060456690,069123456,078987654').split(','),
        maxPhoneAttempts: parseInt(process.env.MAX_PHONE_ATTEMPTS || '3'),
    },
    bot: {
        messageBatchTimeout: parseInt(process.env.MESSAGE_BATCH_TIMEOUT || '5000'),
    }
};

// Validate required config
if (!config.telegram.token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required in .env');
    process.exit(1);
}

if (!config.ai.openaiKey && !config.ai.groqKey) {
    console.warn('⚠️ No AI API key found. Bot will work but AI features will be limited.');
}
