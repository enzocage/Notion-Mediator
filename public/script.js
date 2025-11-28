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

    const mode = document.querySelector('input[name="mode"]:checked').value;

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, mode: mode })
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

let appConfig = {};

async function loadButtons() {
    try {
        const response = await fetch('/api/config');
        appConfig = await response.json();
        updateButtons();
    } catch (error) {
        console.error('Failed to load page buttons:', error);
    }
}

function updateButtons() {
    const container = document.getElementById('page-buttons');
    container.innerHTML = ''; // Clear existing buttons

    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === 'notion') {
        if (appConfig.pageId1) createButton(container, 'Page 1', `https://notion.so/${appConfig.pageId1}`);
        if (appConfig.pageId2) createButton(container, 'Page 2', `https://notion.so/${appConfig.pageId2}`);
    } else {
        if (appConfig.googleDocId1) createButton(container, 'Doc 1', `https://docs.google.com/document/d/${appConfig.googleDocId1}`);
        if (appConfig.googleDocId2) createButton(container, 'Doc 2', `https://docs.google.com/document/d/${appConfig.googleDocId2}`);
    }
}

function createButton(container, text, url) {
    const btn = document.createElement('a');
    btn.href = url;
    btn.target = '_blank';
    btn.textContent = text;
    btn.className = 'page-btn';
    container.appendChild(btn);
}

// Listen for mode changes
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updateButtons);
});

loadButtons();
