// database/db.js
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'oowell.db');

// Ensure database directory exists
const dbDir = dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better performance for concurrent reads

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        phone TEXT,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'ro',
        is_authenticated INTEGER DEFAULT 0,
        phone_attempts INTEGER DEFAULT 0,
        current_state TEXT DEFAULT 'start',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        role TEXT NOT NULL, -- 'user' or 'bot'
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS diagnostic_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        question_num INTEGER,
        answer TEXT,
        score INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id),
        UNIQUE(telegram_id, question_num)
    );

    CREATE TABLE IF NOT EXISTS action_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        action_type TEXT NOT NULL,
        action_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        name TEXT,
        phone TEXT,
        email TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_telegram_id ON conversations(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_diagnostic_telegram_id ON diagnostic_answers(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_action_log_telegram_id ON action_log(telegram_id);
`);

/**
 * User operations
 */
export const userDb = {
    // Get or create user
    getOrCreate(telegramId, userData = {}) {
        const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);

        if (existing) {
            // Update last active
            db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = ?')
                .run(telegramId);
            return existing;
        }

        // Create new user
        const insert = db.prepare(`
            INSERT INTO users (telegram_id, username, first_name, last_name)
            VALUES (?, ?, ?, ?)
        `);

        insert.run(
            telegramId,
            userData.username || null,
            userData.first_name || null,
            userData.last_name || null
        );

        return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
    },

    // Update user
    update(telegramId, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        const stmt = db.prepare(`
            UPDATE users
            SET ${fields}, last_active = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
        `);

        stmt.run(...values, telegramId);
    },

    // Get user
    get(telegramId) {
        return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
    },

    // Check if authenticated
    isAuthenticated(telegramId) {
        const user = this.get(telegramId);
        return user && user.is_authenticated === 1;
    },

    // Authenticate user
    authenticate(telegramId, phone) {
        this.update(telegramId, {
            phone: phone,
            is_authenticated: 1,
            phone_attempts: 0
        });
    },

    // Increment phone attempts
    incrementPhoneAttempts(telegramId) {
        db.prepare('UPDATE users SET phone_attempts = phone_attempts + 1 WHERE telegram_id = ?')
            .run(telegramId);

        const user = this.get(telegramId);
        return user.phone_attempts;
    }
};

/**
 * Conversation operations
 */
export const conversationDb = {
    // Add message
    add(telegramId, role, message) {
        const stmt = db.prepare(`
            INSERT INTO conversations (telegram_id, role, message)
            VALUES (?, ?, ?)
        `);

        stmt.run(telegramId, role, message);
    },

    // Get recent messages
    getRecent(telegramId, limit = 10) {
        return db.prepare(`
            SELECT * FROM conversations
            WHERE telegram_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(telegramId, limit).reverse();
    },

    // Clear conversation
    clear(telegramId) {
        db.prepare('DELETE FROM conversations WHERE telegram_id = ?').run(telegramId);
    }
};

/**
 * Diagnostic operations
 */
export const diagnosticDb = {
    // Save answer
    saveAnswer(telegramId, questionNum, answer, score = 0) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO diagnostic_answers (telegram_id, question_num, answer, score)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(telegramId, questionNum, answer, score);
    },

    // Get all answers
    getAnswers(telegramId) {
        return db.prepare('SELECT * FROM diagnostic_answers WHERE telegram_id = ? ORDER BY question_num')
            .all(telegramId);
    },

    // Clear diagnostic
    clear(telegramId) {
        db.prepare('DELETE FROM diagnostic_answers WHERE telegram_id = ?').run(telegramId);
    },

    // Get answer count
    getCount(telegramId) {
        const result = db.prepare('SELECT COUNT(*) as count FROM diagnostic_answers WHERE telegram_id = ?')
            .get(telegramId);
        return result.count;
    }
};

/**
 * Action log operations
 */
export const actionLogDb = {
    // Log action
    log(telegramId, actionType, actionData = {}) {
        const stmt = db.prepare(`
            INSERT INTO action_log (telegram_id, action_type, action_data)
            VALUES (?, ?, ?)
        `);

        stmt.run(telegramId, actionType, JSON.stringify(actionData));
    },

    // Get recent actions
    getRecent(telegramId, limit = 20) {
        return db.prepare(`
            SELECT * FROM action_log
            WHERE telegram_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(telegramId, limit).reverse();
    }
};

/**
 * Enrollment operations
 */
export const enrollmentDb = {
    // Create enrollment
    create(telegramId, name, phone, email = null) {
        const stmt = db.prepare(`
            INSERT INTO enrollments (telegram_id, name, phone, email)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(telegramId, name, phone, email);
        return result.lastInsertRowid;
    },

    // Get enrollment
    get(telegramId) {
        return db.prepare('SELECT * FROM enrollments WHERE telegram_id = ? ORDER BY created_at DESC LIMIT 1')
            .get(telegramId);
    }
};

export default db;
