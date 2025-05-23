"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitTestExplorerProvider = void 0;
class UnitTestExplorerProvider {
    constructor(_extensionUri, _testService, _authService) {
        this._extensionUri = _extensionUri;
        this._testService = _testService;
        this._authService = _authService;
        this._tests = [];
    }
    async refreshTests() {
        if (this._authService.isAuthenticated()) {
            this._tests = await this._testService.getTests();
            this._view?.webview.postMessage({
                type: "testsUpdated",
                tests: this._tests,
            });
        }
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
                        await this._authService.login(data.username, data.password);
                        this._view?.webview.postMessage({
                            type: "loginSuccess",
                            user: { username: data.username },
                        });
                        await this.refreshTests();
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
                        await this._authService.register(data.username, data.password);
                        this._view?.webview.postMessage({
                            type: "registerSuccess",
                            user: { username: data.username },
                        });
                        // Auto login after successful registration
                        await this._authService.login(data.username, data.password);
                        await this.refreshTests();
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
                        this._tests = [];
                        this._view?.webview.postMessage({
                            type: "testsUpdated",
                            tests: [],
                        });
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "logoutError",
                            error: error.message,
                        });
                    }
                    break;
                case "runTest":
                    try {
                        const result = await this._testService.runTest(data.testId);
                        this._view?.webview.postMessage({
                            type: "testResult",
                            testId: data.testId,
                            result,
                        });
                        await this.refreshTests();
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "testError",
                            error: error.message,
                        });
                    }
                    break;
                case "runAllTests":
                    try {
                        const results = await this._testService.runAllTests();
                        this._view?.webview.postMessage({
                            type: "allTestsResult",
                            results,
                        });
                        await this.refreshTests();
                    }
                    catch (error) {
                        this._view?.webview.postMessage({
                            type: "testError",
                            error: error.message,
                        });
                    }
                    break;
            }
        });
        // Initial load of tests if authenticated
        if (this._authService.isAuthenticated()) {
            this.refreshTests();
        }
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
                .test-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .test-item {
                    padding: 15px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background: var(--vscode-editor-background);
                }
                .test-item.passed {
                    border-color: var(--vscode-testing-iconPassed);
                }
                .test-item.failed {
                    border-color: var(--vscode-testing-iconFailed);
                }
                .test-item.running {
                    border-color: var(--vscode-testing-iconQueued);
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
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
                .user-avatar {
                    display: none;
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
                        <button id="run-all-button">Run All Tests</button>
                    </div>
                    <div id="test-list" class="test-list"></div>
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
                    const testList = document.getElementById('test-list');
                    const userName = document.getElementById('user-name');
                    
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

                    // Handle run all tests
                    document.getElementById('run-all-button').addEventListener('click', () => {
                        vscode.postMessage({
                            type: 'runAllTests'
                        });
                    });
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.type) {
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
                                testList.innerHTML = '';
                                break;
                            case 'logoutError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                            case 'testsUpdated':
                                updateTestList(message.tests);
                                break;
                            case 'testResult':
                                updateTestStatus(message.testId, message.result);
                                break;
                            case 'allTestsResult':
                                message.results.forEach(result => {
                                    updateTestStatus(result.id, result);
                                });
                                break;
                            case 'testError':
                                document.getElementById('login-error').textContent = message.error;
                                break;
                        }
                    });

                    function updateUserInfo(user) {
                        userName.textContent = user.username;
                    }

                    function updateTestList(tests) {
                        testList.innerHTML = tests.map(test => \`
                            <div class="test-item \${test.status}" id="test-\${test.id}">
                                <h3>\${test.name}</h3>
                                <p>\${test.description}</p>
                                <div class="actions">
                                    <button onclick="runTest('\${test.id}')">Run Test</button>
                                </div>
                            </div>
                        \`).join('');
                    }

                    function updateTestStatus(testId, result) {
                        const testElement = document.getElementById(\`test-\${testId}\`);
                        if (testElement) {
                            testElement.className = \`test-item \${result.status}\`;
                            if (result.result) {
                                const resultElement = document.createElement('div');
                                resultElement.innerHTML = \`
                                    <p>Output: \${result.result.output}</p>
                                    \${result.result.error ? \`<p class="error">Error: \${result.result.error}</p>\` : ''}
                                    <p>Execution time: \${result.result.executionTime}ms</p>
                                \`;
                                testElement.appendChild(resultElement);
                            }
                        }
                    }

                    function runTest(testId) {
                        vscode.postMessage({
                            type: 'runTest',
                            testId
                        });
                    }
                })();
            </script>
        </body>
        </html>`;
    }
}
exports.UnitTestExplorerProvider = UnitTestExplorerProvider;
UnitTestExplorerProvider.viewType = "unitTestExplorer";
//# sourceMappingURL=unitTestExplorerProvider.js.map