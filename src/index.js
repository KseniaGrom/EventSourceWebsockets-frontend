import './styles.css';

const loginModal = document.getElementById('login-modal');
const chatContainer = document.getElementById('chat-container');
const nicknameInput = document.getElementById('nickname-input');
const joinBtn = document.getElementById('join-btn');
const errorMsg = document.getElementById('error-msg');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const usersList = document.getElementById('users-list');

let ws = null;
let myId = null;
let myName = null;

function connect(nickname) {
    ws = new WebSocket('eventsourcewebsockets-backend-production.up.railway.app'); 

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'register',
            name: nickname
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    ws.onclose = () => {
        console.log('Disconnected');
    };
}

function handleMessage(data) {
    switch(data.type) {
        case 'error':
            errorMsg.classList.remove('hidden');
            break;
        
        case 'registered':
            myId = data.id;
            loginModal.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            renderUsers(data.users);
            break;

        case 'users':
            renderUsers(data.users);
            break;

        case 'message':
            renderMessage(data);
            break;
    }
}

function renderMessage(data) {
    const div = document.createElement('div');
    const isOwn = data.user.id === myId;
    div.className = `message ${isOwn ? 'own' : 'other'}`;

    const date = new Date();
    const timeString = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

    div.innerHTML = `
        <div class="meta">${isOwn ? 'You' : data.user.name}, ${timeString}</div>
        <div class="text">${data.message}</div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderUsers(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.name;
        if (user.id === myId) {
            li.style.color = 'red';
            li.style.fontWeight = 'bold';
            li.innerHTML = `You <span style="font-weight:normal;color:black;font-size:0.8em;">(${user.name})</span>`;
        }
        usersList.appendChild(li);
    });
}

joinBtn.addEventListener('click', () => {
    const name = nicknameInput.value.trim();
    if (name) {
        errorMsg.classList.add('hidden');
        connect(name);
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const text = messageInput.value.trim();
        if (text) {
            ws.send(JSON.stringify({
                type: 'send',
                message: text
            }));
            messageInput.value = '';
        }
    }
});

nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinBtn.click();
});