# Telegram Bot Integration

## Setup

1. **Install Dependencies**
```bash
pip install python-telegram-bot
```

2. **Add Bot Token to .env**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

3. **Run the Bot**
```bash
python telegram_bot.py
```

## How It Works

1. **User sends photo** → Gemini AI analyzes for civic risks (garbage, stagnant water)
2. **Risk detected** → User shares location
3. **Report filed** → Matched to ward, saved to database
4. **AI generates** → Personal safety precautions sent back to user

## Features

- 📸 Photo analysis using Gemini AI
- 📍 Location-based ward matching
- 💾 Automatic report filing to Supabase
- 🛡️ Personalized health advice
- 🔔 Outbreak notifications (future)

## Bot Commands

- `/start` - Start the bot
- Send photo - Analyze civic risks
- Share location - File report & get advice
