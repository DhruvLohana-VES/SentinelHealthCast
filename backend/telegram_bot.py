import os
import asyncio
import json
import logging
import tempfile
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from supabase import create_client, Client
import google.generativeai as genai

# 1. Setup
load_dotenv()
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([TELEGRAM_TOKEN, GEMINI_KEY, SUPABASE_URL, SUPABASE_KEY]):
    logger.error("❌ Missing Keys in .env")
    exit(1)

genai.configure(api_key=GEMINI_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# In-Memory State
pending_reports = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 **Sentinel Health Bot**\n\n"
        "📸 Send a photo of any civic issue (Garbage, Water, etc.) to help us map disease risks.",
        parse_mode='Markdown'
    )

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    status_msg = await update.message.reply_text("👀 Sentinel Eye is analyzing...")

    try:
        photo_file = await update.message.photo[-1].get_file()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            await photo_file.download_to_drive(temp.name)
            temp_path = temp.name

        file_upload = genai.upload_file(temp_path)
        prompt = """
        Analyze this image for civic risks (Garbage, Stagnant Water).
        Return STRICT JSON: {"risk_detected": bool, "severity": int, "type": "str", "description": "str"}
        """
        response = model.generate_content([prompt, file_upload])
        os.unlink(temp_path)
        
        # Clean JSON
        text = response.text.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(text)

        if analysis.get('risk_detected'):
            pending_reports[user_id] = analysis
            
            # Send Location Button
            btn = KeyboardButton("📍 Share Location", request_location=True)
            markup = ReplyKeyboardMarkup([[btn]], one_time_keyboard=True, resize_keyboard=True)
            
            # Delete status and send new message with keyboard
            await status_msg.delete()
            # Escaping markdown characters in description to be safe or just sending plain text for description
            desc = analysis['description'].replace('*', '').replace('_', '')
            
            await update.message.reply_text(
                f"🚨 **RISK DETECTED** (Level {analysis['severity']})\n"
                f"Type: {analysis['type']}\n"
                f"📝 {desc}\n\n"
                "👇 **Tap below to tag location & get precautions.**",
                parse_mode='Markdown',
                reply_markup=markup
            )
        else:
            await status_msg.edit_text("✅ No risks detected.")

    except Exception as e:
        logger.error(f"Analysis Error: {e}")
        try:
            await status_msg.edit_text("❌ Analysis Error. Please try again.")
        except:
            pass

async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id 
    
    if user_id not in pending_reports:
        await update.message.reply_text("⚠️ Session expired. Please resend photo.")
        return

    data = pending_reports.pop(user_id)
    lat = update.message.location.latitude
    lon = update.message.location.longitude
    
    msg = await update.message.reply_text("📡 Filing Report & Generating Advice...")

    try:
        # 1. Match Ward
        rpc = supabase.rpc('match_ward', {'lat': lat, 'long': lon}).execute()
        ward_id = rpc.data[0]['id'] if rpc.data else None
        ward_name = rpc.data[0]['name'] if rpc.data else "Unknown"

        # 2. Insert Report (WITH CHAT_ID)
        payload = {
            "image_url": "https://placehold.co/600x400/red/white?text=Report",
            "description": data['description'],
            "severity": data['severity'],
            "ward_id": ward_id,
            "location": f"POINT({lon} {lat})",
            "chat_id": chat_id 
        }
        supabase.table('reports').insert(payload).execute()
        
        # 3. Generate Personal Precaution
        advice_prompt = f"""
        User reported: {data['type']} (Severity {data['severity']}/10).
        Give 3 short, bullet-point personal health precautions they should take IMMEDIATELY.
        Do not use markdown formatting (no bold, no italics). Just plain text with emoji bullets.
        """
        advice_res = model.generate_content(advice_prompt)
        advice_text = advice_res.text

        final_msg = (
            f"✅ *Report Filed for {ward_name}*\n\n"
            f"🛡️ *YOUR PERSONAL SAFETY PLAN:*\n"
            f"{advice_text}\n\n"
            "We will notify you if an outbreak is detected in this area."
        )

        # Try sending with Markdown first
        try:
            await msg.edit_text(final_msg, parse_mode='Markdown')
        except Exception as md_error:
            # Fallback to plain text if Markdown fails
            logger.warning(f"Markdown failed: {md_error}. Sending plain text.")
            await msg.edit_text(final_msg.replace('*', ''), parse_mode=None)

    except Exception as e:
        logger.error(f"DB Error: {e}")
        await msg.edit_text("❌ Database Error.")

if __name__ == '__main__':
    if not TELEGRAM_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found.")
        exit(1)
        
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    
    print("🟢 Sentinel Bot Online & Listening...")
    app.run_polling()
