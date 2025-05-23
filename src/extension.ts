import * as vscode from "vscode";
import { ApiService } from "./services/api.service";
import { AuthService } from "./services/auth.service";
import { TestService } from "./services/test.service";
import { ChatService } from "./services/chat.service";
import { UnitTestExplorerProvider } from "./providers/unitTestExplorerProvider";
import { ChatProvider } from "./providers/chatProvider";

export async function activate(context: vscode.ExtensionContext) {
  // Initialize services
  const apiService = new ApiService(context);
  const authService = new AuthService(apiService, context);
  const testService = new TestService(apiService);
  const chatService = new ChatService(apiService);

  // Create and register the Unit Test Explorer
  const unitTestExplorerProvider = new UnitTestExplorerProvider(
    context.extensionUri,
    testService,
    authService
  );

  const chatProvider = new ChatProvider(
    context.extensionUri,
    chatService,
    authService
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      UnitTestExplorerProvider.viewType,
      unitTestExplorerProvider
    ),
    vscode.window.registerWebviewViewProvider(
      ChatProvider.viewType,
      chatProvider
    )
  );

  // Register commands
  let startCommand = vscode.commands.registerCommand(
    "unit-test-extension.start",
    async () => {
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

        vscode.window.showInformationMessage(
          "Unit Test Extension is now active!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start extension: ${error}`);
      }
    }
  );

  // Create test from current file
  let createTestCommand = vscode.commands.registerCommand(
    "unit-test-extension.createTest",
    async () => {
      try {
        const test = await testService.getTestFromCurrentFile();
        if (!test) {
          vscode.window.showErrorMessage("No active editor found");
          return;
        }

        const createdTest = await testService.createTest(test);
        vscode.window.showInformationMessage(
          `Test "${createdTest.name}" created successfully`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create test: ${error}`);
      }
    }
  );

  // Run current test
  let runTestCommand = vscode.commands.registerCommand(
    "unit-test-extension.runTest",
    async () => {
      try {
        const test = await testService.getTestFromCurrentFile();
        if (!test) {
          vscode.window.showErrorMessage("No active editor found");
          return;
        }

        const result = await testService.runTest(test.id);
        if (result.status === "passed") {
          vscode.window.showInformationMessage(`Test "${result.name}" passed!`);
        } else {
          vscode.window.showErrorMessage(
            `Test "${result.name}" failed: ${result.result?.error}`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to run test: ${error}`);
      }
    }
  );

  // Run all tests
  let runAllTestsCommand = vscode.commands.registerCommand(
    "unit-test-extension.runAllTests",
    async () => {
      try {
        const results = await testService.runAllTests();
        const passed = results.filter((t) => t.status === "passed").length;
        const failed = results.filter((t) => t.status === "failed").length;

        vscode.window.showInformationMessage(
          `Tests completed: ${passed} passed, ${failed} failed`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to run tests: ${error}`);
      }
    }
  );

  context.subscriptions.push(
    startCommand,
    createTestCommand,
    runTestCommand,
    runAllTestsCommand
  );
}

export function deactivate() {}
