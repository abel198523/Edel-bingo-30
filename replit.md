# Chewatabingo - Multiplayer Bingo Game

## Overview
Real-time multiplayer Bingo game with wallet system, Telegram bot integration, and WebSocket-based gameplay. The project is designed for Render deployment.

## Project Structure
```
/
├── server.js           # Main Express server with WebSocket and API endpoints
├── bot.js              # Telegram bot with registration and play functionality
├── db/
│   └── database.js     # PostgreSQL database initialization
├── models/
│   ├── User.js         # User model
│   ├── Wallet.js       # Wallet model
│   └── Game.js         # Game model
├── public/
│   ├── index.html      # Main game frontend
│   ├── game.js         # Telegram WebApp integration script
│   ├── styles.css      # Game styles
│   └── script.js       # Game frontend logic
└── package.json        # Dependencies
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `RENDER_SERVER_URL` - Render deployment URL (for bot WebApp)
- `JWT_SECRET` - JWT secret key
- `PORT` - Server port (10000 for Render, 5000 for development)
- `NODE_ENV` - Environment (production/development)

## API Endpoints
- `POST /api/register` - Register user via phone number (Telegram)
- `GET /api/wallet/:userId` - Get user wallet balance
- `POST /api/bet` - Place a bet
- `POST /api/auth/register` - Standard registration
- `POST /api/auth/login` - Standard login

## Telegram Bot Features
- `/start` - Display Register and Play buttons
- Register button - Share phone contact for registration (10 ETB bonus)
- Play button - Open WebApp for gameplay

## Database Schema
- `users` - User accounts with Telegram ID, phone, balance
- `wallets` - User wallet balances
- `transactions` - Transaction history
- `games` - Game sessions
- `game_participants` - Game participants

## Recent Changes
- December 5, 2025: Added Telegram bot integration (bot.js)
- December 5, 2025: Added /api/register and /api/wallet/:userId endpoints
- December 5, 2025: Updated database schema for Telegram user_id (BIGINT)
- December 5, 2025: Added game.js for Telegram WebApp integration

## Deployment
This project is configured for Render deployment (port 10000). Do not convert to Replit hosting.
