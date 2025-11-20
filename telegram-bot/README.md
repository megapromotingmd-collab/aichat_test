# 🧠 OO.WELL Telegram Bot

Asistent virtual pentru sănătatea hormonală feminină - Bot Telegram complet funcțional cu AI integration.

## 📋 Funcționalități

### ✅ Core Features
- **Autentificare securizată** - Whitelist cu numere de telefon autorizate
- **Multi-limbă** - Suport complet pentru Română 🇷🇴 și Русский 🇷🇺
- **Diagnostic inteligent** - 10 întrebări cu scoring și analiză AI
- **AI Integration** - OpenAI GPT-4o-mini sau Groq Llama 3.3 70B
- **Multi-user database** - SQLite cu istoricul complet pentru fiecare utilizator
- **Message batching** - Combină mesaje rapide (5 secunde timeout)
- **Action logging** - Tracking complet al acțiunilor pentru context AI
- **State machine** - Flow conversațional complex (diagnostic, enrollment, chat liber)

### 🎯 Flows Implementate
1. **Language Selection** - Selectare limbă la primul start
2. **Phone Authentication** - Verificare număr telefon (max 3 încercări)
3. **Main Menu** - Meniu principal cu opțiuni
4. **Diagnostic Flow** - 10 întrebări cu progress bar și rezultate AI
5. **Enrollment Flow** - Înregistrare la program (nume, telefon, email)
6. **Free Lesson** - Trimitere link lecție gratuită
7. **Program Info** - Informații despre program
8. **AI Chat** - Chat liber cu context awareness

## 🚀 Quick Start

### 1. Instalare Dependințe

```bash
cd telegram-bot
npm install
```

### 2. Configurare Environment

Creează fișierul `.env` (vezi `.env.example`):

```bash
cp .env.example .env
nano .env
```

**Configurare minimă obligatorie:**

```env
# Telegram Bot Token (obține de la @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# OpenAI API Key (obține de la https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_key_here

# Groq API Key (opțional, pentru Llama 3.3)
GROQ_API_KEY=your_groq_key_here

# AI Provider (openai sau groq)
AI_PROVIDER=openai

# Numere de telefon autorizate (separate prin virgulă)
AUTHORIZED_PHONES=060456690,069123456,078987654
```

### 3. Pornire Bot

```bash
# Development (cu auto-restart)
npm run dev

# Production
npm start
```

## 📱 Cum să creezi Bot-ul pe Telegram

### Pasul 1: Creează Bot-ul cu @BotFather

1. Deschide Telegram și caută `@BotFather`
2. Trimite comanda `/newbot`
3. Alege un nume pentru bot (ex: "OO.WELL Assistant")
4. Alege un username (trebuie să termine cu "bot", ex: "oowell_assistant_bot")
5. **Copiază Token-ul** primit (ex: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Pune token-ul în `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Pasul 2: Obține OpenAI API Key

1. Mergi pe [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Creează cont sau autentifică-te
3. Click pe "Create new secret key"
4. **Copiază key-ul** (ex: `sk-proj-...`)
5. Pune key-ul în `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   ```

**💡 Alternativă gratuită:** Folosește Groq (Llama 3.3 70B) - gratuit și foarte rapid!
- [https://console.groq.com/keys](https://console.groq.com/keys)

### Pasul 3: Configurează Whitelist

Editează lista de numere autorizate în `.env`:

```env
AUTHORIZED_PHONES=060456690,069123456,078987654
```

**Format acceptat:** orice format (cu/fără spații, cu/fără +) - bot-ul curăță automat.

## 🗂️ Structura Proiectului

```
telegram-bot/
├── bot.js                      # Entry point - bot principal
├── package.json                # Dependințe Node.js
├── .env                        # Configurare (NU include în git!)
├── .env.example                # Template pentru configurare
├── config/
│   └── config.js               # Configurare centralizată
├── database/
│   ├── db.js                   # Database layer (SQLite)
│   └── oowell.db               # Database file (creat automat)
├── handlers/
│   ├── messageHandler.js       # Handler mesaje text
│   ├── commandHandler.js       # Handler comenzi (/start, etc)
│   ├── callbackHandler.js      # Handler butoane (callbacks)
│   ├── diagnosticHandler.js    # Handler flow diagnostic
│   └── enrollmentHandler.js    # Handler flow enrollment
└── utils/
    ├── ai.js                   # AI integration (OpenAI/Groq)
    ├── keyboards.js            # Telegram keyboards (butoane)
    └── diagnostic.js           # Întrebări diagnostic + scoring
```

## 💾 Database Schema

Bot-ul folosește **SQLite** cu următoarele tabele:

### `users`
Informații despre utilizatori:
- `telegram_id` (PK)
- `phone`, `username`, `first_name`, `last_name`
- `language` (ro/ru)
- `is_authenticated` (0/1)
- `current_state` (state machine)
- `metadata` (JSON pentru date temporare)

### `conversations`
Istoric conversații:
- `telegram_id` (FK)
- `role` (user/bot)
- `message` (text)
- `timestamp`

### `diagnostic_answers`
Răspunsuri diagnostic:
- `telegram_id` (FK)
- `question_num` (1-10)
- `answer` (text)
- `score` (0-3)

### `action_log`
Log acțiuni pentru AI context:
- `telegram_id` (FK)
- `action_type` (button_click, navigation, etc)
- `action_data` (JSON)
- `timestamp`

### `enrollments`
Înregistrări la program:
- `telegram_id` (FK)
- `name`, `phone`, `email`
- `status` (pending/completed)

## 🤖 AI Integration

### System Prompt

Bot-ul folosește un system prompt detaliat în 2 limbi care definește:
- **Personalitatea** - caldă, empatică, prietenoasă
- **Reguli stricte** - NU diagnostice medicale, NU presiune vânzare
- **Comportament** - răspunsuri scurte (2-3 propoziții), natural, fără markdown
- **Context awareness** - vede istoric acțiuni, diagnostic, autentificare

System prompt-ul este în `utils/ai.js` → `getDefaultSystemPrompt()`

### Context Building

Fiecare răspuns AI primește:
1. **System prompt** - instrucțiuni de bază
2. **Diagnostic info** - dacă user-ul a completat diagnosticul
3. **Action log** - ultimele 20 acțiuni (butoane, navigare)
4. **Conversation history** - ultimele 6 mesaje (3 schimburi)
5. **Authentication status** - dacă user-ul este autentificat

Vezi `utils/ai.js` → `buildActionLogNarrative()` pentru detalii.

## 🔐 Autentificare & Whitelist

### Flow Autentificare:
1. User selectează limba
2. Bot cere număr de telefon
3. Verificare cu whitelist (`AUTHORIZED_PHONES`)
4. **Dacă valid** → Access granted ✅
5. **Dacă invalid** → Max 3 încercări, apoi blocare ❌

### Configurare Whitelist:

```env
# .env
AUTHORIZED_PHONES=060456690,069123456,078987654
```

**În producție:** Mută whitelist-ul într-un database sau API extern pentru management dinamic.

## 📊 State Machine

Bot-ul folosește un **state machine** pentru a gestiona conversațiile:

### States:
- `start` - Initial state
- `phone_verification` - Așteaptă număr telefon
- `blocked` - User blocat (3 încercări failed)
- `main_menu` - Meniu principal
- `diagnostic_intro` - Intro diagnostic
- `diagnostic_q1` ... `diagnostic_q10` - Întrebări diagnostic
- `diagnostic_results` - Rezultate diagnostic
- `enrollment_phone` - Enrollment: cere telefon
- `enrollment_name` - Enrollment: cere nume
- `enrollment_email` - Enrollment: cere email
- `ask_question` - Chat liber cu AI

State-ul curent este salvat în database (`users.current_state`).

## 🚦 Message Batching

Bot-ul combină mesaje rapide pentru a nu suprasolicita AI-ul:

### Funcționare:
1. User trimite mesaj → adăugat în queue
2. Timer de **5 secunde** pornit
3. Dacă user trimite alt mesaj → timer resetat
4. După **5 secunde de tăcere** → toate mesajele combinate și trimise la AI

**Configurare:**
```env
MESSAGE_BATCH_TIMEOUT=5000  # milisecunde
```

Vezi `handlers/messageHandler.js` → `handleBatchedAIChat()`.

## 🔧 Comenzi Disponibile

### User Commands:
- `/start` - Pornește bot-ul sau reîntoarce la meniu

### Admin Commands (de implementat):
- `/stats` - Statistici utilizatori
- `/broadcast` - Mesaj broadcast la toți userii
- `/export` - Export database

## 📈 Logging & Debugging

Bot-ul loggează toate acțiunile în consolă:

```
📨 Message from Maria (123456789): Bună, am nevoie de ajutor...
🌍 User 123456789 selected language: ro
📝 User 123456789 answered Q1: Uneori (score: 1)
✅ Enrollment completed for user 123456789
```

**Emoji-uri folosite:**
- 📨 Mesaj primit
- 🔘 Buton apăsat
- 🌍 Limbă selectată
- 📝 Răspuns diagnostic
- ✅ Acțiune completată
- ❌ Eroare
- 🧠 AI response

## 🐛 Troubleshooting

### Bot nu pornește:

```bash
❌ TELEGRAM_BOT_TOKEN is required in .env
```
**Soluție:** Adaugă token-ul în `.env`

### Bot pornește dar nu răspunde:

1. Verifică că bot-ul rulează: `npm start`
2. Testează cu `/start` în Telegram
3. Verifică consolă pentru erori

### Eroare AI:

```
❌ AI Error: OpenAI API Key missing
```
**Soluție:** Adaugă `OPENAI_API_KEY` în `.env`

### Database locked:

```
❌ Database Error: database is locked
```
**Soluție:** Oprește toate instanțele bot-ului (`pkill -f bot.js`)

## 🚀 Deployment

### Opțiuni Deployment:

1. **VPS (Digital Ocean, Linode, etc)**
   ```bash
   # Instalează Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clonează repo
   git clone https://github.com/your-repo/telegram-bot.git
   cd telegram-bot

   # Instalează dependințe
   npm install

   # Configurează .env
   nano .env

   # Rulează cu PM2
   npm install -g pm2
   pm2 start bot.js --name oowell-bot
   pm2 save
   pm2 startup
   ```

2. **Docker**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   CMD ["node", "bot.js"]
   ```

3. **Heroku**
   - Creează `Procfile`: `worker: node bot.js`
   - Deploy: `git push heroku main`

## 📝 TODO / Îmbunătățiri Viitoare

- [ ] Admin panel (web interface)
- [ ] Broadcast messages
- [ ] Scheduled messages (reminders)
- [ ] Export database to CSV/Excel
- [ ] Analytics dashboard
- [ ] AmoCRM integration (lead creation)
- [ ] Payment integration (Stripe/Paypal)
- [ ] Multi-bot support (același database)
- [ ] Webhook mode (în loc de polling)
- [ ] Redis pentru caching

## 🤝 Contribuții

Contribuțiile sunt binevenite! Deschide un issue sau pull request.

## 📄 Licență

ISC License - vezi `package.json`

## 👨‍💻 Autor

Creat pentru **OO.WELL** - Programul de sănătate hormonală feminină

---

**🎉 Gata! Bot-ul tău Telegram este complet funcțional!**

Pentru suport: https://t.me/oowell_support
