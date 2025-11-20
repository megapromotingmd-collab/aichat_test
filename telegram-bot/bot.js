#!/usr/bin/env node
// bot.js - OO.WELL Telegram Bot
import TelegramBot from 'node-telegram-bot-api';
import { config } from './config/config.js';
import { handleStartCommand } from './handlers/commandHandler.js';
import { handleTextMessage } from './handlers/messageHandler.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🧠 OO.WELL TELEGRAM BOT v1.0                    ║
║         Asistent Virtual pentru Sănătate Hormonală      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

✅ Funcționalități:
   • Autentificare cu număr telefon (whitelist)
   • Suport 2 limbi (Română & Русский)
   • Diagnostic 10 întrebări cu AI analysis
   • Integrare AI (OpenAI / Groq)
   • Multi-user database (SQLite)
   • Message batching (5 secunde)
   • Enrollment flow
   • Action logging pentru context AI

🔧 Configurare:
   • Bot Token: ${config.telegram.token ? '✅ Set' : '❌ Missing'}
   • AI Provider: ${config.ai.provider.toUpperCase()}
   • ${config.ai.provider === 'openai' ? 'OpenAI' : 'Groq'} API Key: ${(config.ai.provider === 'openai' ? config.ai.openaiKey : config.ai.groqKey) ? '✅ Set' : '❌ Missing'}
   • Database: ${config.database.path}
   • Authorized phones: ${config.auth.authorizedPhones.length} numbers

`);

// Initialize bot
const bot = new TelegramBot(config.telegram.token, { polling: true });

// Error handling for polling
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
});

// Global error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Handle /start command
 */
bot.onText(/\/start/, async (msg) => {
    try {
        await handleStartCommand(bot, msg);
    } catch (error) {
        console.error('❌ Error handling /start:', error.message);
    }
});

/**
 * Handle text messages
 */
bot.on('message', async (msg) => {
    try {
        // Ignore commands (already handled by onText)
        if (msg.text && msg.text.startsWith('/')) {
            return;
        }

        // Ignore non-text messages
        if (!msg.text) {
            return;
        }

        await handleTextMessage(bot, msg);
    } catch (error) {
        console.error('❌ Error handling message:', error.message);
    }
});

/**
 * Handle callback queries (button clicks)
 */
bot.on('callback_query', async (query) => {
    try {
        await handleCallbackQuery(bot, query);
    } catch (error) {
        console.error('❌ Error handling callback:', error.message);
    }
});

// Bot started
console.log('🚀 Bot started successfully!');
console.log('📱 Waiting for messages...\n');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down bot gracefully...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down bot gracefully...');
    bot.stopPolling();
    process.exit(0);
});
