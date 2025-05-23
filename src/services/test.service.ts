import * as vscode from "vscode";
import { ApiService } from "./api.service";

export interface TestCase {
  id: string;
  name: string;
  description: string;
  code: string;
  expectedOutput: string;
  language: string;
  status: "pending" | "running" | "passed" | "failed";
  result?: {
    output: string;
    error?: string;
    executionTime: number;
  };
}

export class TestService {
  constructor(private apiService: ApiService) {}

  public async createTest(
    test: Omit<TestCase, "id" | "status">
  ): Promise<TestCase> {
    return this.apiService.post<TestCase>("/tests", test);
  }

  public async getTests(): Promise<TestCase[]> {
    return this.apiService.get<TestCase[]>("/tests");
  }

  public async getTest(id: string): Promise<TestCase> {
    return this.apiService.get<TestCase>(`/tests/${id}`);
  }

  public async updateTest(
    id: string,
    test: Partial<TestCase>
  ): Promise<TestCase> {
    return this.apiService.put<TestCase>(`/tests/${id}`, test);
  }

  public async deleteTest(id: string): Promise<void> {
    await this.apiService.delete(`/tests/${id}`);
  }

  public async runTest(id: string): Promise<TestCase> {
    return this.apiService.post<TestCase>(`/tests/${id}/run`);
  }

  public async runAllTests(): Promise<TestCase[]> {
    return this.apiService.post<TestCase[]>("/tests/run-all");
  }

  public async getTestFromCurrentFile(): Promise<TestCase | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const text = document.getText();
    const language = document.languageId;

    const testName =
      document.fileName
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";

    return {
      id: "", // Will be assigned by the server
      name: testName,
      description: `Test for ${testName}`,
      code: text,
      expectedOutput: "",
      language,
      status: "pending",
    };
  }

  public async saveTestToFile(test: TestCase): Promise<void> {
    const fileName = `${test.name}.${this.getFileExtension(test.language)}`;
    const content = this.generateTestFileContent(test);

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error("No workspace folder is open");
    }

    const filePath = vscode.Uri.joinPath(
      workspaceFolders[0].uri,
      "tests",
      fileName
    );

    try {
      await vscode.workspace.fs.writeFile(filePath, Buffer.from(content));
      vscode.window.showInformationMessage(`Test saved to ${fileName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save test: ${error}`);
    }
  }

  private getFileExtension(language: string): string {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
    };
    return extensions[language] || "txt";
  }

  private generateTestFileContent(test: TestCase): string {
    // This is a simple example - you might want to implement more sophisticated test file generation
    return `// Test: ${test.name}
// Description: ${test.description}

${test.code}

// Expected output:
${test.expectedOutput}`;
  }
}
