"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const api_service_1 = require("./services/api.service");
const auth_service_1 = require("./services/auth.service");
const test_service_1 = require("./services/test.service");
const chat_service_1 = require("./services/chat.service");
const unitTestExplorerProvider_1 = require("./providers/unitTestExplorerProvider");
const chatProvider_1 = require("./providers/chatProvider");
async function activate(context) {
    // Initialize services
    const apiService = new api_service_1.ApiService(context);
    const authService = new auth_service_1.AuthService(apiService, context);
    const testService = new test_service_1.TestService(apiService);
    const chatService = new chat_service_1.ChatService(apiService);
    // Create and register the Unit Test Explorer
    const unitTestExplorerProvider = new unitTestExplorerProvider_1.UnitTestExplorerProvider(context.extensionUri, testService, authService);
    const chatProvider = new chatProvider_1.ChatProvider(context.extensionUri, chatService, authService);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(unitTestExplorerProvider_1.UnitTestExplorerProvider.viewType, unitTestExplorerProvider), vscode.window.registerWebviewViewProvider(chatProvider_1.ChatProvider.viewType, chatProvider));
    // Register commands
    let startCommand = vscode.commands.registerCommand("unit-test-extension.start", async () => {
        try {
            // Check authentication
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
                // Show login form
                const email = await vscode.window.showInputBox({
                    prompt: "Enter your email",
                    placeHolder: "email@example.com",
                });
                if (!email) {
                    return;
                }
                const password = await vscode.window.showInputBox({
                    prompt: "Enter your password",
                    password: true,
                });
                if (!password) {
                    return;
                }
                await authService.login(email, password);
            }
            vscode.window.showInformationMessage("Unit Test Extension is now active!");
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start extension: ${error}`);
        }
    });
    // Create test from current file
    let createTestCommand = vscode.commands.registerCommand("unit-test-extension.createTest", async () => {
        try {
            const test = await testService.getTestFromCurrentFile();
            if (!test) {
                vscode.window.showErrorMessage("No active editor found");
                return;
            }
            const createdTest = await testService.createTest(test);
            vscode.window.showInformationMessage(`Test "${createdTest.name}" created successfully`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create test: ${error}`);
        }
    });
    // Run current test
    let runTestCommand = vscode.commands.registerCommand("unit-test-extension.runTest", async () => {
        try {
            const test = await testService.getTestFromCurrentFile();
            if (!test) {
                vscode.window.showErrorMessage("No active editor found");
                return;
            }
            const result = await testService.runTest(test.id);
            if (result.status === "passed") {
                vscode.window.showInformationMessage(`Test "${result.name}" passed!`);
            }
            else {
                vscode.window.showErrorMessage(`Test "${result.name}" failed: ${result.result?.error}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to run test: ${error}`);
        }
    });
    // Run all tests
    let runAllTestsCommand = vscode.commands.registerCommand("unit-test-extension.runAllTests", async () => {
        try {
            const results = await testService.runAllTests();
            const passed = results.filter((t) => t.status === "passed").length;
            const failed = results.filter((t) => t.status === "failed").length;
            vscode.window.showInformationMessage(`Tests completed: ${passed} passed, ${failed} failed`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to run tests: ${error}`);
        }
    });
    context.subscriptions.push(startCommand, createTestCommand, runTestCommand, runAllTestsCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map