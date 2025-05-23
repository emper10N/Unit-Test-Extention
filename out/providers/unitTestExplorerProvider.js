"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitTestExplorerProvider = void 0;
class UnitTestExplorerProvider {
    constructor(_extensionUri, _authService, _apiService) {
        this._extensionUri = _extensionUri;
        this._authService = _authService;
        this._apiService = _apiService;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "login":
                    try {
                        if (!this.validateUsername(data.username)) {
                            this._view?.webview.postMessage({
                                type: "loginError",
                                error: "Username can only contain letters and digits",
                            });
                            return;
                        }
                        await this._authService.login(data.username, data.password);
                        this._view?.webview.postMessage({
                            type: "loginSuccess",
                            user: { username: data.username },
                        });
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "loginError",
                            error: error.message,
                        });
                    }
                    break;
                case "register":
                    try {
                        if (!this.validateUsername(data.username)) {
                            this._view?.webview.postMessage({
                                type: "registerError",
                                error: "Username can only contain letters and digits",
                            });
                            return;
                        }
                        await this._authService.register(data.username, data.password);
                        this._view?.webview.postMessage({
                            type: "registerSuccess",
                            user: { username: data.username },
                        });
                        await this._authService.login(data.username, data.password);
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "registerError",
                            error: error.message,
                        });
                    }
                    break;
                case "logout":
                    try {
                        await this._authService.logout();
                        this._view?.webview.postMessage({ type: "logoutSuccess" });
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "logoutError",
                            error: error.message,
                        });
                    }
                    break;
                case "createChat":
                    try {
                        const isAuthenticated = await this._authService.checkAuth();
                        if (!isAuthenticated) {
                            this._view?.webview.postMessage({
                                type: "chatError",
                                error: "You must be logged in to create a chat",
                            });
                            return;
                        }
                        if (!data.name || typeof data.name !== "string") {
                            this._view?.webview.postMessage({
                                type: "chatError",
                                error: "Invalid chat name",
                            });
                            return;
                        }
                        const trimmedName = data.name.trim();
                        if (!this.validateChatName(trimmedName)) {
                            this._view?.webview.postMessage({
                                type: "chatError",
                                error: "Chat name can only contain letters, digits, spaces and basic punctuation",
                            });
                            return;
                        }
                        console.log("Creating chat with name:", trimmedName);
                        const result = await this._apiService.post("/api/v1/chats", {
                            name: trimmedName,
                        });
                        console.log("Chat created successfully:", result);
                        this._view?.webview.postMessage({
                            type: "chatCreated",
                            chatId: result.chatId,
                        });
                    }
                    catch (error) {
                        console.error("Error creating chat:", error);
                        this._view?.webview.postMessage({
                            type: "chatError",
                            error: error.message || "Failed to create chat",
                        });
                    }
                    break;
            }
        });
        this._view?.webview.postMessage({
            type: "showAuth",
        });
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unit Test Explorer</title>
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .auth-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .auth-tabs {
                    display: flex;
                    gap: 10px;
                    border-bottom: 1px solid var(--vscode-input-border);
                    padding-bottom: 10px;
                }
                .auth-tab {
                    padding: 8px 16px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    color: var(--vscode-foreground);
                }
                .auth-tab.active {
                    border-bottom: 2px solid var(--vscode-button-background);
                }
                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .form-group label {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                input {
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 4px;
                }
                input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }
                button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                    font-weight: 500;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .error {
                    color: var(--vscode-errorForeground);
                    font-size: 12px;
                    margin-top: 5px;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div id="auth-container" class="auth-container">
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Login</button>
                        <button class="auth-tab" data-tab="register">Register</button>
                    </div>
                    
                    <div id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                            <input type="text" id="login-username" placeholder="Enter your username" />
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input type="password" id="login-password" placeholder="Enter your password" />
                        </div>
                        <button id="login-button">Login</button>
                        <div id="login-error" class="error"></div>
                    </div>

                    <div id="register-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label for="register-username">Username</label>
                            <input type="text" id="register-username" placeholder="Enter your username" />
                        </div>
                        <div class="form-group">
                            <label for="register-password">Password</label>
                            <input type="password" id="register-password" placeholder="Enter your password" />
                        </div>
                        <div class="form-group">
                            <label for="register-confirm-password">Confirm Password</label>
                            <input type="password" id="register-confirm-password" placeholder="Confirm your password" />
                        </div>
                        <button id="register-button">Register</button>
                        <div id="register-error" class="error"></div>
                    </div>
                </div>

                <div id="content" style="display: none;">
                    <div id="user-info" class="user-info">
                        <div id="user-name"></div>
                    </div>
                    
                    <h2>Unit Test Explorer</h2>
                    <div class="actions">
                        <button id="create-chat-button">Create Chat</button>
                    </div>
                    <button id="logout-button">Logout</button>
                </div>
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const authContainer = document.getElementById('auth-container');
                    const content = document.getElementById('content');
                    const loginForm = document.getElementById('login-form');
                    const registerForm = document.getElementById('register-form');
                    const userName = document.getElementById('user-name');
                    
                    // Show auth container by default
                    authContainer.style.display = 'block';
                    content.style.display = 'none';
                    
                    // Tab switching
                    document.querySelectorAll('.auth-tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                            tab.classList.add('active');
                            
                            if (tab.dataset.tab === 'login') {
                                loginForm.style.display = 'flex';
                                registerForm.style.display = 'none';
                            } else {
                                loginForm.style.display = 'none';
                                registerForm.style.display = 'flex';
                            }
                        });
                    });
                    
                    // Handle login
                    document.getElementById('login-button').addEventListener('click', () => {
                        const username = document.getElementById('login-username').value;
                        const password = document.getElementById('login-password').value;
                        
                        if (!username || !password) {
                            document.getElementById('login-error').textContent = 'Please fill in all fields';
                            return;
                        }
                        
                        vscode.postMessage({
                            type: 'login',
                            username,
                            password
                        });
                    });
                    
                    // Handle register
                    document.getElementById('register-button').addEventListener('click', () => {
                        const username = document.getElementById('register-username').value;
                        const password = document.getElementById('register-password').value;
                        const confirmPassword = document.getElementById('register-confirm-password').value;
                        
                        if (!username || !password || !confirmPassword) {
                            document.getElementById('register-error').textContent = 'Please fill in all fields';
                            return;
                        }
                        
                        if (password !== confirmPassword) {
                            document.getElementById('register-error').textContent = 'Passwords do not match';
                            return;
                        }
                        
                        vscode.postMessage({
                            type: 'register',
                            username,
                            password
                        });
                    });
                    
                    // Handle logout
                    document.getElementById('logout-button').addEventListener('click', () => {
                        vscode.postMessage({
                            type: 'logout'
                        });
                    });

                    // Handle create chat
                    document.getElementById('create-chat-button').addEventListener('click', () => {
                        const chatName = 'CHAT';
                        if (chatName) {
                            vscode.postMessage({
                                type: 'createChat',
                                name: chatName
                            });
                        }
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.type) {
                            case 'showAuth':
                                authContainer.style.display = 'block';
                                content.style.display = 'none';
                                break;
                            case 'loginSuccess':
                            case 'registerSuccess':
                                authContainer.style.display = 'none';
                                content.style.display = 'block';
                                document.getElementById('login-error').textContent = '';
                                document.getElementById('register-error').textContent = '';
                                if (message.user) {
                                    updateUserInfo(message.user);
                                } else {
                                    const username = document.getElementById('login-username').value;
                                    updateUserInfo({ username });
                                }
                                break;
                            case 'loginError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                            case 'registerError':
                                document.getElementById('register-error').textContent = message.error;
                                break;
                            case 'logoutSuccess':
                                authContainer.style.display = 'block';
                                content.style.display = 'none';
                                document.getElementById('login-error').textContent = '';
                                document.getElementById('register-error').textContent = '';
                                // Clear form fields
                                document.getElementById('login-username').value = '';
                                document.getElementById('login-password').value = '';
                                document.getElementById('register-username').value = '';
                                document.getElementById('register-password').value = '';
                                document.getElementById('register-confirm-password').value = '';
                                break;
                            case 'logoutError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                            case 'chatCreated':
                                alert('Chat created with ID: ' + message.chatId);
                                break;
                            case 'chatError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                        }
                    });

                    function updateUserInfo(user) {
                        userName.textContent = user.username;
                    }
                })();
            </script>
        </body>
        </html>`;
    }
    validateUsername(username) {
        // Проверяем, что имя пользователя содержит только буквы и цифры
        return /^[a-zA-Z0-9]+$/.test(username);
    }
    validateChatName(name) {
        // Проверяем, что имя чата содержит только буквы, цифры, пробелы и базовую пунктуацию
        return /^[a-zA-Z0-9\s.,!?-]+$/.test(name);
    }
}
exports.UnitTestExplorerProvider = UnitTestExplorerProvider;
UnitTestExplorerProvider.viewType = "unitTestExplorer";
//# sourceMappingURL=unitTestExplorerProvider.js.map