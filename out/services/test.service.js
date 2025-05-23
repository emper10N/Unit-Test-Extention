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
exports.TestService = void 0;
const vscode = __importStar(require("vscode"));
class TestService {
    constructor(apiService) {
        this.apiService = apiService;
    }
    async createTest(test) {
        return this.apiService.post("/tests", test);
    }
    async getTests() {
        return this.apiService.get("/tests");
    }
    async getTest(id) {
        return this.apiService.get(`/tests/${id}`);
    }
    async updateTest(id, test) {
        return this.apiService.put(`/tests/${id}`, test);
    }
    async deleteTest(id) {
        await this.apiService.delete(`/tests/${id}`);
    }
    async runTest(id) {
        return this.apiService.post(`/tests/${id}/run`);
    }
    async runAllTests() {
        return this.apiService.post("/tests/run-all");
    }
    async getTestFromCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        const document = editor.document;
        const text = document.getText();
        const language = document.languageId;
        const testName = document.fileName
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
    async saveTestToFile(test) {
        const fileName = `${test.name}.${this.getFileExtension(test.language)}`;
        const content = this.generateTestFileContent(test);
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error("No workspace folder is open");
        }
        const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, "tests", fileName);
        try {
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(content));
            vscode.window.showInformationMessage(`Test saved to ${fileName}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to save test: ${error}`);
        }
    }
    getFileExtension(language) {
        const extensions = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            java: "java",
            csharp: "cs",
        };
        return extensions[language] || "txt";
    }
    generateTestFileContent(test) {
        // This is a simple example - you might want to implement more sophisticated test file generation
        return `// Test: ${test.name}
// Description: ${test.description}

${test.code}

// Expected output:
${test.expectedOutput}`;
    }
}
exports.TestService = TestService;
//# sourceMappingURL=test.service.js.map