/**
 * Chewatabingo Frontend Script (script.js)
 * * ይህ ኮድ የቢንጎ ጨዋታውን የፊት ለፊት መቆጣጠሪያ (UI logic) እና ከ WebSocket ጋር ያለውን ግንኙነት ያከናውናል።
 * * የ Render URL: wss://edel-bingoo.onrender.com
 */

// =======================================================
// 1. የሰርቨር ውቅረት
// =======================================================
// የ Render URLዎ በመሆኑ ምክንያት wss:// ፕሮቶኮልን እንጠቀማለን
const WS_BASE_URL = 'wss://edel-bingoo.onrender.com'; 

let socket = null;
let userData = null; 
let currentStake = 10;
let currentGameData = null;
let selectedCardId = null;

// =======================================================
// 2. የ UI ክፍሎች መምረጥ (DOM Elements)
// =======================================================

const landingScreen = document.getElementById('landing-screen');
const selectionScreen = document.getElementById('selection-screen');
const gameScreen = document.getElementById('game-screen');
const landingPlayBtn = document.getElementById('landing-play-btn');
const stakeButtons = document.querySelectorAll('.stake-btn');
const confirmCardBtn = document.getElementById('confirm-card-btn');
const selectionFooter = document.querySelector('.selection-footer');
const authModal = document.getElementById('auth-modal');
const cardSelectionGrid = document.getElementById('card-selection-grid');

const currentBalanceDisplay = document.getElementById('current-balance');
const currentStakeDisplay = document.getElementById('current-stake');

const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');
const btnStakeAmount = document.getElementById('btn-stake-amount');

// =======================================================
// 3. UI መቆጣጠሪያ ተግባራት
// =======================================================

function showScreen(screenId) {
    // ሁሉንም ስክሪኖች መጀመሪያ መደበቅ
    landingScreen.style.display = 'none';
    selectionScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    authModal.style.display = 'none';

    // የተመረጠውን ስክሪን ማሳየት
    if (screenId === 'landing') {
        landingScreen.style.display = 'flex';
    } else if (screenId === 'selection') {
        selectionScreen.style.display = 'flex';
    } else if (screenId === 'game') {
        gameScreen.style.display = 'flex';
    } else if (screenId === 'auth') {
        authModal.style.display = 'flex';
    }
}

function updateStakeSelection(stake) {
    currentStake = stake;
    // ሁሉንም የመወራረጃ ቁልፎች በ Landing እና Selection footer ውስጥ ማዘመን
    document.querySelectorAll('.stake-btn').forEach(btn => {
        btn.classList.remove('active-stake');
        if (parseInt(btn.dataset.stake) === stake) {
            btn.classList.add('active-stake');
        }
    });
    // በ Play ቁልፉ ላይ ያለውን መጠን ማዘመን
    btnStakeAmount.textContent = currentStake;
    currentStakeDisplay.textContent = `${currentStake} ብር`;
}

function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectionDot.classList.remove('disconnected');
        connectionDot.classList.add('connected');
        connectionText.textContent = 'ተገናኝቷል';
    } else {
        connectionDot.classList.remove('connected');
        connectionDot.classList.add('disconnected');
        connectionText.textContent = 'ግንኙነት የለም';
    }
}

// =======================================================
// 4. የ WebSocket ግንኙነት እና መልዕክት መቆጣጠሪያ
// =======================================================

function connectWebSocket() {
    // የቴሌግራም Mini App ውሂብ መኖሩን ማረጋገጥ
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
        console.error("Telegram Mini App initData አልተገኘም! ወደ መግቢያ ገጽ ተመለስ.");
        showScreen('landing');
        // ለጊዜው Auth Modal ላይ ማሳየት
        showScreen('auth'); 
        return; 
    }
    
    // የ WebSocket ግንኙነት መክፈት
    socket = new WebSocket(WS_BASE_URL + `?initData=${initData}`);

    socket.onopen = () => {
        console.log("WebSocket ተገናኝቷል.");
        updateConnectionStatus(true);
        // ግንኙነት ከተመሰረተ በኋላ የካርድ መምረጫ ገጽ ይከፈታል
        showScreen('selection');
        // በዳታቤዝ ላይ የተቀመጠውን የካርድ ቁጥር ማጽዳት
        selectedCardId = null;
        confirmCardBtn.disabled = true;
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("መልዕክት ከሰርቨር:", message);
        
        if (message.type === 'WELCOME') {
            userData = message.user;
            // ሒሳብን ማዘመን
            currentBalanceDisplay.textContent = `${(message.balance || 0).toFixed(2)} ብር`;

        } else if (message.type === 'GAME_INFO') {
            currentGameData = message.game;
            showScreen('game');
            document.getElementById('game-id-display').textContent = currentGameData.id;

        } else if (message.type === 'CARD_SELECTED') {
            document.getElementById('confirmation-status').textContent = `✅ ካርድ #${message.cardId} ተመርጧል! በመጠባበቅ ላይ...`;
            // ካርድ ሲመረጥ Play ቁልፍን ማጥፋት
            confirmCardBtn.disabled = true; 
            
        } else if (message.type === 'ERROR') {
            console.error("የሰርቨር ስህተት:", message.message);
            // የ Toast መልዕክት ማሳየት
        }
    };

    socket.onclose = () => {
        console.warn("WebSocket ግንኙነት ተቋርጧል!");
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 5000); 
    };

    socket.onerror = (error) => {
        console.error("WebSocket ስህተት:", error);
        updateConnectionStatus(false);
    };
}


// =======================================================
// 5. የክስተት አድማጮች (Event Listeners)
// =======================================================

// ➡️ የመወራረጃ (Stake) ምርጫ - ሁሉንም .stake-btn ይይዛል
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('stake-btn')) {
        const stake = parseInt(e.target.dataset.
