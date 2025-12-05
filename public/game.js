let currentUserId = null;
let currentStake = 10;
let ws = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeUser();
    loadWallet();
    initializeWebSocket();
});

function initializeUser() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
                currentUserId = tg.initDataUnsafe.user.id;
                console.log('Telegram user ID:', currentUserId);
            } else {
                currentUserId = 999999;
                console.log('Using mock user ID:', currentUserId);
            }
        } else {
            currentUserId = 999999;
            console.log('Telegram WebApp not available, using mock ID:', currentUserId);
        }
    } catch (error) {
        console.error('Error initializing user:', error);
        currentUserId = 999999;
    }
}

async function loadWallet() {
    try {
        const response = await fetch(`/api/wallet/${currentUserId}`);
        const data = await response.json();
        
        updateWalletDisplay(data.balance);
        
        if (data.stake) {
            currentStake = data.stake;
        }
        
        console.log('Wallet loaded:', data);
    } catch (error) {
        console.error('Error loading wallet:', error);
        updateWalletDisplay(0);
    }
}

function updateWalletDisplay(balance) {
    const walletElement = document.getElementById('main-wallet-value');
    if (walletElement) {
        walletElement.textContent = parseFloat(balance).toFixed(2);
    }
}

function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('WebSocket connected');
        if (currentUserId && currentUserId !== 999999) {
            ws.send(JSON.stringify({
                type: 'auth_telegram',
                telegramId: currentUserId.toString(),
                username: 'Player_' + currentUserId
            }));
        }
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ws.onclose = function() {
        console.log('WebSocket disconnected');
        setTimeout(initializeWebSocket, 3000);
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'init':
            console.log('Game initialized:', data);
            break;
        case 'auth_success':
            console.log('Authentication successful:', data.user);
            if (data.user && data.user.balance !== undefined) {
                updateWalletDisplay(data.user.balance);
            }
            break;
        case 'balance_update':
            updateWalletDisplay(data.balance);
            break;
        case 'card_confirmed':
            updateWalletDisplay(data.balance);
            break;
        case 'phase_change':
            console.log('Phase changed:', data.phase);
            break;
        case 'number_called':
            console.log('Number called:', data.letter + data.number);
            break;
        case 'timer_update':
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

async function handleCardConfirmation(cardId) {
    if (!currentUserId) {
        console.error('User not initialized');
        return { success: false, message: 'User not initialized' };
    }
    
    try {
        const response = await fetch('/api/bet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId,
                stakeAmount: currentStake
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateWalletDisplay(result.balance);
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'confirm_card',
                    cardId: cardId
                }));
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error placing bet:', error);
        return { success: false, message: 'Bet failed' };
    }
}

function refreshBalance() {
    loadWallet();
}

window.currentUserId = currentUserId;
window.currentStake = currentStake;
window.handleCardConfirmation = handleCardConfirmation;
window.refreshBalance = refreshBalance;
