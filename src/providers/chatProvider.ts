import * as vscode from "vscode";
import { ChatService, Message } from "../services/chat.service";
import { AuthService } from "../services/auth.service";

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "unitTestChat";

  private _view?: vscode.WebviewView;
  private _messages: Message[] = [];
  private _isLoading = false;
  private _hasMore = true;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _chatService: ChatService,
    private readonly _authService: AuthService
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
        case "loadMessages":
          await this._loadMessages();
          break;
        case "sendMessage":
          await this._sendMessage(
            data.content,
            data.messageType,
            data.metadata
          );
          break;
        case "deleteMessage":
          await this._deleteMessage(data.messageId);
          break;
        case "editMessage":
          await this._editMessage(data.messageId, data.content);
          break;
        case "searchMessages":
          await this._searchMessages(data.query);
          break;
      }
    });

    if (this._authService.isAuthenticated()) {
      this._loadMessages();
    }
  }

  private async _loadMessages() {
    if (this._isLoading || !this._hasMore || !this._view) {
      return;
    }

    this._isLoading = true;
    this._view.webview.postMessage({ type: "setLoading", value: true });

    try {
      const lastMessage = this._messages[this._messages.length - 1];
      const messages = await this._chatService.getMessages(50, lastMessage?.id);

      if (messages.length < 50) {
        this._hasMore = false;
      }

      this._messages = [...this._messages, ...messages];
      this._view.webview.postMessage({
        type: "setMessages",
        messages: this._messages,
      });
    } catch (error) {
      vscode.window.showErrorMessage("Failed to load messages");
    } finally {
      this._isLoading = false;
      this._view.webview.postMessage({ type: "setLoading", value: false });
    }
  }

  private async _sendMessage(
    content: string,
    type: Message["type"] = "text",
    metadata?: Message["metadata"]
  ) {
    if (!this._view) {
      return;
    }

    try {
      const message = await this._chatService.sendMessage(
        content,
        type,
        metadata
      );
      this._messages = [message, ...this._messages];
      this._view.webview.postMessage({
        type: "setMessages",
        messages: this._messages,
      });
    } catch (error) {
      vscode.window.showErrorMessage("Failed to send message");
    }
  }

  private async _deleteMessage(messageId: string) {
    if (!this._view) {
      return;
    }

    try {
      await this._chatService.deleteMessage(messageId);
      this._messages = this._messages.filter((m) => m.id !== messageId);
      this._view.webview.postMessage({
        type: "setMessages",
        messages: this._messages,
      });
    } catch (error) {
      vscode.window.showErrorMessage("Failed to delete message");
    }
  }

  private async _editMessage(messageId: string, content: string) {
    if (!this._view) {
      return;
    }

    try {
      const message = await this._chatService.editMessage(messageId, content);
      this._messages = this._messages.map((m) =>
        m.id === messageId ? message : m
      );
      this._view.webview.postMessage({
        type: "setMessages",
        messages: this._messages,
      });
    } catch (error) {
      vscode.window.showErrorMessage("Failed to edit message");
    }
  }

  private async _searchMessages(query: string) {
    if (!this._view) {
      return;
    }

    try {
      const messages = await this._chatService.searchMessages(query);
      this._view.webview.postMessage({
        type: "setMessages",
        messages: messages,
      });
    } catch (error) {
      vscode.window.showErrorMessage("Failed to search messages");
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chat</title>
                <style>
                    body {
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        background-color: var(--vscode-editor-background);
                    }

                    .chat-container {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        padding: 10px;
                    }

                    .messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                        display: flex;
                        flex-direction: column-reverse;
                    }

                    .message {
                        margin-bottom: 10px;
                        padding: 8px;
                        border-radius: 6px;
                        max-width: 80%;
                    }

                    .message.sent {
                        align-self: flex-end;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }

                    .message.received {
                        align-self: flex-start;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                    }

                    .message-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 4px;
                        font-size: 0.8em;
                        opacity: 0.8;
                    }

                    .message-content {
                        word-break: break-word;
                    }

                    .message-actions {
                        display: none;
                        margin-top: 4px;
                    }

                    .message:hover .message-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .message-actions button {
                        background: none;
                        border: none;
                        color: var(--vscode-textLink-foreground);
                        cursor: pointer;
                        padding: 2px 4px;
                        font-size: 0.8em;
                    }

                    .message-actions button:hover {
                        text-decoration: underline;
                    }

                    .input-container {
                        display: flex;
                        gap: 8px;
                        padding: 10px;
                        border-top: 1px solid var(--vscode-panel-border);
                    }

                    .message-input {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 4px;
                    }

                    .send-button {
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }

                    .send-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }

                    .loading {
                        text-align: center;
                        padding: 10px;
                        color: var(--vscode-descriptionForeground);
                    }

                    .code-block {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 8px;
                        margin: 4px 0;
                        font-family: var(--vscode-editor-font-family);
                    }

                    .test-message {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                    }

                    .test-message button {
                        padding: 4px 8px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }

                    .test-message button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="messages" id="messages">
                        <div class="loading" id="loading" style="display: none;">Loading messages...</div>
                    </div>
                    <div class="input-container">
                        <input type="text" class="message-input" id="messageInput" placeholder="Type a message...">
                        <button class="send-button" id="sendButton">Send</button>
                    </div>
                </div>

                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        const messagesContainer = document.getElementById('messages');
                        const messageInput = document.getElementById('messageInput');
                        const sendButton = document.getElementById('sendButton');
                        const loading = document.getElementById('loading');
                        let isLoading = false;
                        let hasMore = true;

                        function createMessageElement(message) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = \`message \${message.sender.id === 'current-user' ? 'sent' : 'received'}\`;
                            
                            const header = document.createElement('div');
                            header.className = 'message-header';
                            header.innerHTML = \`
                                <span>\${message.sender.name}</span>
                                <span>\${new Date(message.timestamp).toLocaleString()}</span>
                            \`;
                            
                            const content = document.createElement('div');
                            content.className = 'message-content';
                            
                            if (message.type === 'code') {
                                const codeBlock = document.createElement('pre');
                                codeBlock.className = 'code-block';
                                codeBlock.textContent = message.content;
                                content.appendChild(codeBlock);
                            } else if (message.type === 'test') {
                                const testMessage = document.createElement('div');
                                testMessage.className = 'test-message';
                                testMessage.innerHTML = \`
                                    <span>Test shared</span>
                                    <button onclick="vscode.postMessage({ type: 'runTest', testId: '\${message.metadata.testId}' })">
                                        Run Test
                                    </button>
                                \`;
                                content.appendChild(testMessage);
                            } else {
                                content.textContent = message.content;
                            }
                            
                            const actions = document.createElement('div');
                            actions.className = 'message-actions';
                            
                            if (message.sender.id === 'current-user') {
                                actions.innerHTML = \`
                                    <button onclick="editMessage('\${message.id}')">Edit</button>
                                    <button onclick="deleteMessage('\${message.id}')">Delete</button>
                                \`;
                            }
                            
                            messageDiv.appendChild(header);
                            messageDiv.appendChild(content);
                            messageDiv.appendChild(actions);
                            
                            return messageDiv;
                        }

                        function loadMessages() {
                            if (isLoading || !hasMore) {
                                return;
                            }
                            
                            vscode.postMessage({ type: 'loadMessages' });
                        }

                        function sendMessage() {
                            const content = messageInput.value.trim();
                            if (!content) {
                                return;
                            }
                            
                            vscode.postMessage({
                                type: 'sendMessage',
                                content,
                                messageType: 'text'
                            });
                            
                            messageInput.value = '';
                        }

                        function deleteMessage(messageId) {
                            if (confirm('Are you sure you want to delete this message?')) {
                                vscode.postMessage({
                                    type: 'deleteMessage',
                                    messageId
                                });
                            }
                        }

                        function editMessage(messageId) {
                            const message = messages.find(m => m.id === messageId);
                            if (!message) {
                                return;
                            }
                            
                            const newContent = prompt('Edit message:', message.content);
                            if (newContent === null) {
                                return;
                            }
                            
                            vscode.postMessage({
                                type: 'editMessage',
                                messageId,
                                content: newContent
                            });
                        }

                        // Event listeners
                        sendButton.addEventListener('click', sendMessage);
                        messageInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        });

                        messagesContainer.addEventListener('scroll', () => {
                            if (messagesContainer.scrollTop === 0) {
                                loadMessages();
                            }
                        });

                        // Message handling
                        window.addEventListener('message', event => {
                            const message = event.data;
                            
                            switch (message.type) {
                                case 'setMessages':
                                    messagesContainer.innerHTML = '';
                                    message.messages.forEach(msg => {
                                        messagesContainer.appendChild(createMessageElement(msg));
                                    });
                                    break;
                                    
                                case 'setLoading':
                                    loading.style.display = message.value ? 'block' : 'none';
                                    isLoading = message.value;
                                    break;
                            }
                        });

                        // Initial load
                        loadMessages();
                    })();
                </script>
            </body>
            </html>`;
  }
}
