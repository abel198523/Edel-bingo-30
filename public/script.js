/**
 * Chewatabingo Frontend Script (script.js)
 * * ይህ ኮድ የቢንጎ ጨዋታውን የፊት ለፊት መቆጣጠሪያ (UI logic) እና ከ WebSocket ጋር ያለውን ግንኙነት ያከናውናል።
 */

// =======================================================
// 1. የሰርቨር ውቅረት (በእርስዎ Render URL የተስተካከለ)
// =======================================================
// የ Render URLዎ በመሆኑ ምክንያት wss:// ፕሮቶኮልን እንጠቀማለን
const WS_BASE_URL = 'wss://edel-bingoo.onrender.com'; 

let socket = null;
let userData = null; 
let currentStake = 10;
let currentGameData = null;
let selectedCardId = null;

// =======================================================
// 2. የ UI ክፍሎች መምረጥ
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
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
        console.error("Telegram Mini App initData አልተገኘም! (ከቦት ውጪ ነው የተከፈተው?)");
        showScreen('landing');
        return; 
    }
    
    // የ WebSocket ግንኙነት መክፈት
    socket = new WebSocket(WS_BASE_URL + `?initData=${initData}`);

    socket.onopen = () => {
        console.log("WebSocket ተገናኝቷል.");
        updateConnectionStatus(true);
        // ግንኙነት ከተመሰረተ በኋላ የካርድ መምረጫ ገጽ ይከፈታል
        showScreen('selection');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("መልዕክት ከሰርቨር:", message);
        
        if (message.type === 'WELCOME') {
            userData = message.user;
            // ሒሳብን ማዘመን (እርስዎ በ HTML ውስጥ የሰጡትን ID ይጠቀማል)
            document.getElementById('current-balance').textContent = `${(message.balance || 0).toFixed(2)} ብር`;

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
            // የ Toast መልዕክት ማሳየት (የቶስት ተግባር አልተጻፈም)
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

// ➡️ የመወራረጃ (Stake) ምርጫ
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('stake-btn')) {
        const stake = parseInt(e.target.dataset.stake);
        updateStakeSelection(stake);
    }
});

// ➡️ የመግቢያ 'Play' ቁልፍ
landingPlayBtn.addEventListener('click', () => {
    // ወደ ምርጫ ገጽ መሄድ እና WebSocket ግንኙነት መጀመር
    showScreen('selection'); 
    connectWebSocket(); 
});

// ➡️ ካርድ መርጦ የመጫወት ቁልፍ
confirmCardBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN && selectedCardId) {
        const message = {
            action: 'JOIN_GAME',
            stake: currentStake,
            card_id: selectedCardId // በ UI ላይ የተመረጠው ካርድ
        };
        socket.send(JSON.stringify(message));
    } else {
        console.error("ካርድ አልተመረጠም ወይም WebSocket አልተከፈተም.");
        // ግንኙነት ለመፍጠር እንደገና መሞከር
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
    }
});

// =======================================================
// 6. የካርድ መምረጫ ገጽ መሙላት
// =======================================================

function populateCardSelectionGrid() {
    // 100 ካርዶችን ለመምረጥ መፍጠር
    for (let i = 1; i <= 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'card-select-cell';
        cell.textContent = i;
        cell.dataset.cardId = i;
        
        cell.addEventListener('click', () => {
            // የካርድ ምርጫ ሎጂክ
            document.querySelectorAll('.card-select-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedCardId = i; // የተመረጠውን ካርድ ID ማስቀመጥ
            confirmCardBtn.disabled = false; // ካርድ ሲመረጥ Play ቁልፍን ማንቃት
        });
        
        cardSelectionGrid.appendChild(cell);
    }
}

// =======================================================
// 7. የመጀመሪያ ገጽ ጭነት
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    // የመወራረጃ ዋጋን በ10 ብር መጀመር
    updateStakeSelection(10); 
    
    // የካርድ መምረጫ ግሪድን መሙላት
    populateCardSelectionGrid();

    // ቴሌግራም ዌብ አፕ መኖሩን ማረጋገጥ
    if (window.Telegram?.WebApp) {
        // ገጹ ለ Mini App ዝግጁ መሆኑን ማሳወቅ
        window.Telegram.WebApp.ready();
        
        // የቴሌግራም Mini Appን ዳራ ቀለም እንዲጠቀም መፍቀድ
        if (window.Telegram.WebApp.themeParams) {
            document.body.style.backgroundColor = window.Telegram.WebApp.themeParams.bg_color;
        }

        // ገጹ ሲጫን ወደ ማረፊያ ገጽ መሄድ (Play ሲጫኑ ነው የሚገናኘው)
        showScreen('landing');
    } else {
        // ከቴሌግራም ውጪ ከሆነ
        console.warn("ከቴሌግራም Mini App ውጪ ተከፈተ.");
        showScreen('landing');
    }
});
