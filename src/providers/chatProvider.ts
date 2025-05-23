import * as vscode from "vscode";

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "unitTestChat";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === "createChat") {
        try {
          const response = await fetch("http://localhost:5001/api/v1/chats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: data.name }),
          });
          if (!response.ok) {
            throw new Error("Failed to create chat");
          }
          const result = await response.json();
          this._view?.webview.postMessage({
            type: "chatCreated",
            chatId: result.chatId,
          });
        } catch (error) {
          this._view?.webview.postMessage({
            type: "chatError",
            error: (error as Error).message,
          });
        }
      }
    });
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
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
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
        </style>
      </head>
      <body>
        <div class="container">
          <button id="create-chat-button">Create Chat</button>
          <div id="error" class="error"></div>
        </div>
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            
            // Handle create chat
            document.getElementById('create-chat-button').addEventListener('click', () => {
              const chatName = prompt('Enter chat name:');
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
                case 'chatCreated':
                  alert('Chat created with ID: ' + message.chatId);
                  break;
                case 'chatError':
                  document.getElementById('error').textContent = message.error;
                  break;
              }
            });
          })();
        </script>
      </body>
      </html>`;
  }
}
