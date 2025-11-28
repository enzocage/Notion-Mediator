const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender === 'user' ? 'user-message' : 'agent-message');
    div.textContent = text;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        const data = await response.json();
        addMessage(data.response, 'agent');
    } catch (error) {
        addMessage("Error connecting to server.", 'agent');
        console.error(error);
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function loadButtons() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        const container = document.getElementById('page-buttons');

        if (config.pageId1) {
            const btn1 = document.createElement('a');
            btn1.href = `https://notion.so/${config.pageId1}`;
            btn1.target = '_blank';
            btn1.textContent = 'Page 1';
            btn1.className = 'page-btn';
            container.appendChild(btn1);
        }

        if (config.pageId2) {
            const btn2 = document.createElement('a');
            btn2.href = `https://notion.so/${config.pageId2}`;
            btn2.target = '_blank';
            btn2.textContent = 'Page 2';
            btn2.className = 'page-btn';
            container.appendChild(btn2);
        }
    } catch (error) {
        console.error('Failed to load page buttons:', error);
    }
}

loadButtons();
