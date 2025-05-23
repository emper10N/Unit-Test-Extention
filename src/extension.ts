import * as vscode from "vscode";
import { ApiService } from "./services/api.service";
import { AuthService } from "./services/auth.service";
import { UnitTestExplorerProvider } from "./providers/unitTestExplorerProvider";

export async function activate(context: vscode.ExtensionContext) {
  const apiService = new ApiService(context);
  const authService = new AuthService(apiService, context);

  const unitTestExplorerProvider = new UnitTestExplorerProvider(
    context.extensionUri,
    authService,
    apiService
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      UnitTestExplorerProvider.viewType,
      unitTestExplorerProvider
    )
  );

  let startCommand = vscode.commands.registerCommand(
    "unit-test-extension.start",
    async () => {
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

        vscode.window.showInformationMessage(
          "Unit Test Extension is now active!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start extension: ${error}`);
      }
    }
  );
}

export function deactivate() {}
