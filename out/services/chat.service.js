"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
class ChatService {
    constructor(apiService) {
        this.apiService = apiService;
    }
    async getMessages(limit = 50, before) {
        return this.apiService.get("/chat/messages", {
            limit,
            before,
        });
    }
    async sendMessage(content, type = "text", metadata) {
        return this.apiService.post("/chat/messages", {
            content,
            type,
            metadata,
        });
    }
    async sendCodeMessage(code, language) {
        return this.sendMessage(code, "code", { language });
    }
    async sendTestMessage(testId) {
        return this.sendMessage("Test shared", "test", { testId });
    }
    async deleteMessage(messageId) {
        await this.apiService.delete(`/chat/messages/${messageId}`);
    }
    async editMessage(messageId, content) {
        return this.apiService.put(`/chat/messages/${messageId}`, {
            content,
        });
    }
    async getMessage(messageId) {
        return this.apiService.get(`/chat/messages/${messageId}`);
    }
    async searchMessages(query) {
        return this.apiService.get("/chat/messages/search", {
            query,
        });
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map