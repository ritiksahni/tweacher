const style = document.createElement('style');
style.textContent = `
    .tweet-assistant-panel {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        max-height: 500px;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border: 1px solid #E5E5E5;
    }

    .panel-header {
        padding: 16px;
        background: #000000;
        color: #FFFFFF;
        border-radius: 16px 16px 0 0;
        font-weight: 600;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        letter-spacing: 0.3px;
    }

    .action-buttons {
        padding: 12px;
        display: flex;
        gap: 8px;
        border-bottom: 1px solid #E5E5E5;
        background: #FFFFFF;
    }

    .explain-button {
        background: #000000;
        color: #FFFFFF;
        border: none;
        border-radius: 24px;
        padding: 10px 20px;
        cursor: pointer;
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .explain-button:hover {
        background: #333333;
    }

    .chat-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 16px;
        max-height: 350px;
        background: #FFFFFF;
    }

    .message {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
        color: #000000;
    }

    .user-message {
        background: #F0F0F0;
        margin-right: 20px;
        margin-left: 8px;
    }

    .assistant-message {
        background: #000000;
        color: #FFFFFF;
        margin-left: 20px;
        margin-right: 8px;
    }

    .input-container {
        padding: 12px;
        border-top: 1px solid #E5E5E5;
        display: flex;
        background: #FFFFFF;
        border-radius: 0 0 16px 16px;
    }

    .chat-input {
        flex-grow: 1;
        padding: 10px 16px;
        border: 1px solid #E5E5E5;
        border-radius: 24px;
        margin-right: 8px;
        font-size: 13px;
        transition: border-color 0.2s ease;
        outline: none;
    }

    .chat-input:focus {
        border-color: #000000;
    }

    .send-button {
        background: #000000;
        color: #FFFFFF;
        border: none;
        border-radius: 24px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .send-button:hover {
        background: #333333;
    }

    .minimize-button {
        background: none;
        border: none;
        color: #FFFFFF;
        cursor: pointer;
        font-size: 18px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }

    .minimize-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    /* Custom scrollbar for chat container */
    .chat-container::-webkit-scrollbar {
        width: 6px;
    }

    .chat-container::-webkit-scrollbar-track {
        background: #F0F0F0;
    }

    .chat-container::-webkit-scrollbar-thumb {
        background: #000000;
        border-radius: 3px;
    }

    /* Disable buttons */
    .explain-button:disabled,
    .send-button:disabled {
        background: #CCCCCC;
        cursor: not-allowed;
    }

    .api-key-container {
        padding: 16px;
        background: #FFFFFF;
        display: none;
        border-bottom: 1px solid #E5E5E5;
    }

    .api-key-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #E5E5E5;
        border-radius: 8px;
        margin-bottom: 8px;
        font-size: 13px;
    }

    .api-key-button {
        background: #000000;
        color: #FFFFFF;
        border: none;
        border-radius: 24px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        width: 100%;
    }

    .settings-button {
        background: none;
        border: none;
        color: #FFFFFF;
        cursor: pointer;
        padding: 4px 8px;
        margin-right: 8px;
        border-radius: 4px;
    }

    .settings-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .error-message {
        color: #FF0000;
        font-size: 12px;
        margin-top: 4px;
    }
`;
document.head.appendChild(style);

class TweetAssistant {
    constructor() {
        this.apiKey = null;
        this.initialize();
    }

    async initialize() {
        this.panel = this.createPanel();
        this.chatHistory = [];
        this.currentTweet = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.setupDragAndDrop();
        this.minimized = false;

        const result = await chrome.storage.local.get(['openai_api_key']);
        this.apiKey = result.openai_api_key;
        
        if (!this.apiKey) {
            this.showApiKeyInput();
        }
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'tweet-assistant-panel';
        
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `
            <div>
                <button class="settings-button">⚙️</button>
                <span>Tweacher</span>
            </div>
            <button class="minimize-button">−</button>
        `;
        
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.innerHTML = `
            <button class="explain-button">Explain Tweet</button>
        `;
        
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        inputContainer.innerHTML = `
            <input type="text" class="chat-input" placeholder="Ask a question...">
            <button class="send-button">Send</button>
        `;

        const apiKeyContainer = document.createElement('div');
        apiKeyContainer.className = 'api-key-container';
        apiKeyContainer.innerHTML = `
            <input type="password" class="api-key-input" placeholder="Enter your OpenAI API key">
            <button class="api-key-button">Save API Key</button>
            <div class="error-message"></div>
        `;

        panel.appendChild(header);
        panel.appendChild(actionButtons);
        panel.appendChild(chatContainer);
        panel.appendChild(inputContainer);
        panel.appendChild(apiKeyContainer);

        actionButtons.querySelector('.explain-button').addEventListener('click', () => {
            if (this.currentTweet) {
                this.explainTweet(this.currentTweet);
            } else {
                this.addMessage('assistant', 'Please select a tweet first by clicking on it.');
            }
        });

        header.querySelector('.minimize-button').addEventListener('click', () => this.toggleMinimize());
        inputContainer.querySelector('.send-button').addEventListener('click', () => this.sendMessage());
        inputContainer.querySelector('.chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        header.querySelector('.settings-button').addEventListener('click', () => this.toggleApiKeyInput());
        
        const apiKeyButton = apiKeyContainer.querySelector('.api-key-button');
        const apiKeyInput = apiKeyContainer.querySelector('.api-key-input');
        
        apiKeyButton.addEventListener('click', () => this.saveApiKey(apiKeyInput.value));

        document.body.appendChild(panel);
        return panel;
    }

    toggleApiKeyInput() {
        const container = this.panel.querySelector('.api-key-container');
        const input = container.querySelector('.api-key-input');
        
        if (container.style.display === 'none' || !container.style.display) {
            container.style.display = 'block';
            input.value = this.apiKey || '';
        } else {
            container.style.display = 'none';
        }
    }

    showApiKeyInput() {
        const container = this.panel.querySelector('.api-key-container');
        container.style.display = 'block';
    }

    async saveApiKey(key) {
        if (!key) {
            this.showError('Please enter an API key');
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 5
                })
            });

            if (!response.ok) {
                throw new Error('Invalid API key');
            }

            this.apiKey = key;
            await chrome.storage.local.set({ 'openai_api_key': key });
            
            const container = this.panel.querySelector('.api-key-container');
            container.style.display = 'none';
            
            this.addMessage('assistant', 'API key saved successfully! You can now use the assistant.');
        } catch (error) {
            this.showError('Invalid API key. Please check and try again.');
        }
    }

    showError(message) {
        const errorDiv = this.panel.querySelector('.error-message');
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.textContent = '';
        }, 5000);
    }

    setupDragAndDrop() {
        const header = this.panel.querySelector('.panel-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.className === 'minimize-button') return;
            this.isDragging = true;
            const rect = this.panel.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            this.panel.style.left = `${Math.max(0, Math.min(window.innerWidth - this.panel.offsetWidth, x))}px`;
            this.panel.style.top = `${Math.max(0, Math.min(window.innerHeight - this.panel.offsetHeight, y))}px`;
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    toggleMinimize() {
        const chatContainer = this.panel.querySelector('.chat-container');
        const inputContainer = this.panel.querySelector('.input-container');
        const minimizeButton = this.panel.querySelector('.minimize-button');

        this.minimized = !this.minimized;
        
        if (this.minimized) {
            chatContainer.style.display = 'none';
            inputContainer.style.display = 'none';
            minimizeButton.textContent = '+';
        } else {
            chatContainer.style.display = 'block';
            inputContainer.style.display = 'flex';
            minimizeButton.textContent = '−';
        }
    }

    async explainTweet(tweetText) {
        if (!this.apiKey) {
            this.showApiKeyInput();
            this.addMessage('assistant', 'Please enter your OpenAI API key to continue.');
            return;
        }

        this.currentTweet = tweetText;
        this.addMessage('assistant', 'Analyzing tweet...');

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `Please explain this tweet in simple terms: "${tweetText}"`
                    }],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            const explanation = data.choices[0].message.content;
            
            const chatContainer = this.panel.querySelector('.chat-container');
            chatContainer.removeChild(chatContainer.lastChild);
            
            this.addMessage('assistant', explanation);
        } catch (error) {
            this.addMessage('assistant', 'Sorry, I encountered an error while analyzing the tweet.');
            console.error('Error:', error);
        }
    }

    async sendMessage() {
        if (!this.apiKey) {
            this.showApiKeyInput();
            this.addMessage('assistant', 'Please enter your OpenAI API key to continue.');
            return;
        }

        const input = this.panel.querySelector('.chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        input.value = '';

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: `Context: We're discussing this tweet: "${this.currentTweet}"` },
                        ...this.chatHistory,
                        { role: 'user', content: message }
                    ],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            const reply = data.choices[0].message.content;
            this.addMessage('assistant', reply);
        } catch (error) {
            this.addMessage('assistant', 'Sorry, I encountered an error while processing your message.');
            console.error('Error:', error);
        }
    }

    addMessage(role, content) {
        const chatContainer = this.panel.querySelector('.chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        this.chatHistory.push({ role, content });
    }

    setTweet(tweetElement) {
        const tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.innerText;
        if (tweetText) {
            this.currentTweet = tweetText;
            this.addMessage('assistant', 'Tweet selected. Click "Explain Tweet" or ask a question.');
        }
    }
}

const assistant = new TweetAssistant();

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                const tweets = node.querySelectorAll('article[data-testid="tweet"]');
                tweets.forEach((tweet) => {
                    if (!tweet.dataset.hasListener) {
                        tweet.dataset.hasListener = 'true';
                        tweet.addEventListener('click', (e) => {
                            // Only trigger if clicking the tweet content, not links or buttons
                            if (!e.target.closest('a') && !e.target.closest('button')) {
                                assistant.setTweet(tweet);
                            }
                        });
                    }
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
