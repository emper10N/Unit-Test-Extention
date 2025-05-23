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
const unitTestExplorerProvider_1 = require("./providers/unitTestExplorerProvider");
async function activate(context) {
    const apiService = new api_service_1.ApiService(context);
    const authService = new auth_service_1.AuthService(apiService, context);
    const unitTestExplorerProvider = new unitTestExplorerProvider_1.UnitTestExplorerProvider(context.extensionUri, authService, apiService);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(unitTestExplorerProvider_1.UnitTestExplorerProvider.viewType, unitTestExplorerProvider));
    let startCommand = vscode.commands.registerCommand("unit-test-extension.start", async () => {
        try {
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
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
}
function deactivate() { }
//# sourceMappingURL=extension.js.map