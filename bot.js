require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const RENDER_SERVER_URL = process.env.RENDER_SERVER_URL || 'https://your-render-app.onrender.com';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        keyboard: [
            [
                { text: 'Register', request_contact: true }
            ],
            [
                { text: 'Play', web_app: { url: `${RENDER_SERVER_URL}/index.html` } }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
    
    bot.sendMessage(chatId, 'Welcome to Chewatabingo! Register to get 10 ETB welcome bonus, then tap Play to start!', {
        reply_markup: keyboard
    });
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    
    const userId = contact.user_id;
    const phoneNumber = contact.phone_number;
    
    try {
        const response = await fetch(`${RENDER_SERVER_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                phoneNumber: phoneNumber
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            bot.sendMessage(chatId, `Registration successful! You have received a 10 ETB welcome bonus. Tap 'Play' to start playing!`);
        } else {
            bot.sendMessage(chatId, result.message || 'You are already registered. Tap "Play" to continue!');
        }
    } catch (error) {
        console.error('Registration error:', error);
        bot.sendMessage(chatId, 'Registration failed. Please try again later.');
    }
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('Telegram Bot is running...');
