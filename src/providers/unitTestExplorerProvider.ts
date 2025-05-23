import * as vscode from "vscode";
import { AuthService } from "../services/auth.service";
import { ApiService } from "../services/api.service";

interface ChatMessage {
  content: string;
  type: "text" | "code";
  language?: string;
}

interface ChatResponse {
  chatId: string;
  content?: string;
}

interface Chat {
  chatId: string;
  name: string;
  createdAt: string;
  creatorUserId: string;
  messages: {
    id: string;
    chatId: string;
    order: number;
    role: string;
    content: string;
  }[];
}

interface ChatsResponse {
  chats: Chat[];
}

export class UnitTestExplorerProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "unitTestExplorer";
  private _view?: vscode.WebviewView;
  private _currentChatId?: string;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _authService: AuthService,
    private readonly _apiService: ApiService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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
            // Load chats after successful login
            await this.loadChats();
          } catch (error) {
            this._view?.webview.postMessage({
              type: "loginError",
              error: (error as Error).message,
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
            // Load chats after successful registration and login
            await this.loadChats();
          } catch (error) {
            this._view?.webview.postMessage({
              type: "registerError",
              error: (error as Error).message,
            });
          }
          break;
        case "logout":
          try {
            await this._authService.logout();
            this._view?.webview.postMessage({ type: "logoutSuccess" });
          } catch (error) {
            this._view?.webview.postMessage({
              type: "logoutError",
              error: (error as Error).message,
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
                error:
                  "Chat name can only contain letters, digits, spaces and basic punctuation",
              });
              return;
            }

            console.log("Creating chat with name:", trimmedName);
            const result = await this._apiService.post<ChatResponse>(
              "/api/v1/chats",
              {
                name: trimmedName,
              }
            );
            console.log("Chat created successfully:", result);

            this._currentChatId = result.chatId;
            this._view?.webview.postMessage({
              type: "chatCreated",
              chatId: result.chatId,
            });
            // Reload chats after creating a new one
            await this.loadChats();
          } catch (error) {
            console.error("Error creating chat:", error);
            this._view?.webview.postMessage({
              type: "chatError",
              error: (error as Error).message || "Failed to create chat",
            });
          }
          break;
        case "sendMessage":
          try {
            const isAuthenticated = await this._authService.checkAuth();
            if (!isAuthenticated) {
              this._view?.webview.postMessage({
                type: "messageError",
                error: "You must be logged in to send messages",
              });
              return;
            }

            if (!this._currentChatId) {
              this._view?.webview.postMessage({
                type: "messageError",
                error: "No active chat",
              });
              return;
            }

            const message: ChatMessage = {
              content: data.content,
              type: data.messageType || "text",
              language: data.language,
            };

            const result = await this._apiService.post<ChatResponse>(
              `/api/v1/chats/${this._currentChatId}/messages`,
              message
            );

            this._view?.webview.postMessage({
              type: "messageSent",
              content: result.content,
            });
          } catch (error) {
            this._view?.webview.postMessage({
              type: "messageError",
              error: (error as Error).message || "Failed to send message",
            });
          }
          break;
        case "loadChats":
          await this.loadChats();
          break;
        case "openChat":
          this._currentChatId = data.chatId;
          this._view?.webview.postMessage({
            type: "chatOpened",
            chatId: data.chatId,
          });
          break;
      }
    });

    this._view?.webview.postMessage({
      type: "showAuth",
    });
  }

  private async loadChats() {
    try {
      const isAuthenticated = await this._authService.checkAuth();
      if (!isAuthenticated) {
        console.log("User is not authenticated, skipping chat load");
        return;
      }

      console.log("Loading chats...");
      const response = await this._apiService.get<ChatsResponse>(
        "/api/v1/chats"
      );
      console.log("Chats loaded:", response);

      this._view?.webview.postMessage({
        type: "chatsLoaded",
        chats: response.chats,
      });
    } catch (error) {
      console.error("Error loading chats:", error);
      this._view?.webview.postMessage({
        type: "chatsError",
        error: (error as Error).message || "Failed to load chats",
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
                    height: 100vh;
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
                .chat-container {
                    display: none;
                    flex-direction: column;
                    gap: 20px;
                    height: 100%;
                }
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                }
                .chat-id {
                    font-family: var(--vscode-editor-font-family);
                    color: var(--vscode-descriptionForeground);
                }
                .back-button {
                    padding: 4px 8px;
                    font-size: 12px;
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                }
                .message {
                    padding: 10px;
                    border-radius: 4px;
                    max-width: 80%;
                }
                .message.user {
                    align-self: flex-end;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .message.model {
                    align-self: flex-start;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                }
                .message.code {
                    font-family: var(--vscode-editor-font-family);
                    white-space: pre-wrap;
                }
                .input-container {
                    display: flex;
                    gap: 10px;
                }
                textarea {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 4px;
                    resize: vertical;
                    min-height: 60px;
                }
                textarea:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }
                .message-type-selector {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .message-type-selector button {
                    flex: 1;
                }
                .message-type-selector button.active {
                    background: var(--vscode-button-hoverBackground);
                }
                .chats-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }
                .chat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    cursor: pointer;
                }
                .chat-item:hover {
                    background: var(--vscode-editor-hoverHighlightBackground);
                }
                .chat-item-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .chat-item-name {
                    font-weight: 500;
                }
                .chat-item-date {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                .chat-item-messages {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                .refresh-button {
                    padding: 4px 8px;
                    font-size: 12px;
                    margin-left: 10px;
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
                    
                    <div class="header">
                        <h2>Unit Test Explorer</h2>
                        <div class="actions">
                            <button id="create-chat-button">Create Chat</button>
                            <button id="refresh-chats-button" class="refresh-button">↻</button>
                        </div>
                    </div>

                    <div id="chats-list" class="chats-list"></div>
                    <button id="logout-button">Logout</button>
                </div>

                <div id="chat-container" class="chat-container">
                    <div class="chat-header">
                        <div class="chat-id">Chat ID: <span id="current-chat-id"></span></div>
                        <button id="back-button" class="back-button">← Back</button>
                    </div>
                    <div class="message-type-selector">
                        <button id="text-type" class="active">Text</button>
                        <button id="code-type">Code</button>
                    </div>
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <textarea id="message-input" placeholder="Type your message..."></textarea>
                        <button id="send-button">Send</button>
                    </div>
                    <div id="chat-error" class="error"></div>
                </div>
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const authContainer = document.getElementById('auth-container');
                    const content = document.getElementById('content');
                    const chatContainer = document.getElementById('chat-container');
                    const loginForm = document.getElementById('login-form');
                    const registerForm = document.getElementById('register-form');
                    const userName = document.getElementById('user-name');
                    const messagesContainer = document.getElementById('messages');
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const errorDiv = document.getElementById('chat-error');
                    const textTypeButton = document.getElementById('text-type');
                    const codeTypeButton = document.getElementById('code-type');
                    const currentChatId = document.getElementById('current-chat-id');
                    const backButton = document.getElementById('back-button');
                    const chatsList = document.getElementById('chats-list');
                    const refreshChatsButton = document.getElementById('refresh-chats-button');
                    
                    let currentMessageType = 'text';
                    
                    // Show auth container by default
                    authContainer.style.display = 'block';
                    content.style.display = 'none';
                    chatContainer.style.display = 'none';
                    
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

                    // Handle refresh chats
                    refreshChatsButton.addEventListener('click', () => {
                        vscode.postMessage({
                            type: 'loadChats'
                        });
                    });

                    function addMessage(content, type, isUser = false) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${isUser ? 'user' : 'model'} \${type === 'code' ? 'code' : ''}\`;
                        messageDiv.textContent = content;
                        messagesContainer.appendChild(messageDiv);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                    
                    textTypeButton.addEventListener('click', () => {
                        currentMessageType = 'text';
                        textTypeButton.classList.add('active');
                        codeTypeButton.classList.remove('active');
                        messageInput.placeholder = 'Type your message...';
                    });
                    
                    codeTypeButton.addEventListener('click', () => {
                        currentMessageType = 'code';
                        codeTypeButton.classList.add('active');
                        textTypeButton.classList.remove('active');
                        messageInput.placeholder = 'Paste your code here...';
                    });
                    
                    sendButton.addEventListener('click', () => {
                        const content = messageInput.value.trim();
                        if (!content) return;
                        
                        vscode.postMessage({
                            type: 'sendMessage',
                            content,
                            messageType: currentMessageType,
                            language: currentMessageType === 'code' ? 'typescript' : undefined
                        });
                        
                        addMessage(content, currentMessageType, true);
                        messageInput.value = '';
                    });
                    
                    messageInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendButton.click();
                        }
                    });

                    backButton.addEventListener('click', () => {
                        content.style.display = 'block';
                        chatContainer.style.display = 'none';
                    });

                    function formatDate(dateString) {
                        const date = new Date(dateString);
                        return date.toLocaleString();
                    }

                    function updateChatsList(chats) {
                        console.log('Updating chats list with:', chats);
                        chatsList.innerHTML = '';
                        if (!chats || chats.length === 0) {
                            const noChatsMessage = document.createElement('div');
                            noChatsMessage.className = 'chat-item';
                            noChatsMessage.textContent = 'No chats available';
                            chatsList.appendChild(noChatsMessage);
                            return;
                        }
                        chats.forEach(chat => {
                            const chatItem = document.createElement('div');
                            chatItem.className = 'chat-item';
                            chatItem.innerHTML = \`
                                <div class="chat-item-info">
                                    <div class="chat-item-name">\${chat.name}</div>
                                    <div class="chat-item-date">Created: \${formatDate(chat.createdAt)}</div>
                                    <div class="chat-item-messages">Messages: \${chat.messages ? chat.messages.length : 0}</div>
                                </div>
                            \`;
                            chatItem.addEventListener('click', () => {
                                vscode.postMessage({
                                    type: 'openChat',
                                    chatId: chat.chatId
                                });
                            });
                            chatsList.appendChild(chatItem);
                        });
                    }
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.type) {
                            case 'showAuth':
                                authContainer.style.display = 'block';
                                content.style.display = 'none';
                                chatContainer.style.display = 'none';
                                break;
                            case 'loginSuccess':
                            case 'registerSuccess':
                                authContainer.style.display = 'none';
                                content.style.display = 'block';
                                chatContainer.style.display = 'none';
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
                                chatContainer.style.display = 'none';
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
                                content.style.display = 'none';
                                chatContainer.style.display = 'flex';
                                messagesContainer.innerHTML = '';
                                errorDiv.textContent = '';
                                currentChatId.textContent = message.chatId;
                                break;
                            case 'chatError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                            case 'messageSent':
                                addMessage(message.content, 'text');
                                break;
                            case 'messageError':
                                errorDiv.textContent = message.error;
                                break;
                            case 'chatsLoaded':
                                console.log('Received chats:', message.chats);
                                updateChatsList(message.chats);
                                break;
                            case 'chatsError':
                                console.error('Error loading chats:', message.error);
                                break;
                            case 'chatOpened':
                                content.style.display = 'none';
                                chatContainer.style.display = 'flex';
                                messagesContainer.innerHTML = '';
                                errorDiv.textContent = '';
                                currentChatId.textContent = message.chatId;
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

  private validateUsername(username: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(username);
  }

  private validateChatName(name: string): boolean {
    return /^[a-zA-Z0-9\s.,!?-]+$/.test(name);
  }
}
