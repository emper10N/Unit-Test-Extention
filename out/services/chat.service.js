"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
class ChatService {
    constructor(_apiService) {
        this._apiService = _apiService;
    }
    async getMessages(limit = 50, before) {
        return this._apiService.get("/chat/messages", {
            limit,
            before,
        });
    }
    async sendMessage(content, type = "text", metadata) {
        return this._apiService.post("/chat/messages", {
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
        await this._apiService.delete(`/chat/messages/${messageId}`);
    }
    async editMessage(messageId, content) {
        return this._apiService.put(`/chat/messages/${messageId}`, {
            content,
        });
    }
    async getMessage(messageId) {
        return this._apiService.get(`/chat/messages/${messageId}`);
    }
    async searchMessages(query) {
        return this._apiService.get("/chat/messages/search", {
            query,
        });
    }
    async createChat(name) {
        try {
            const response = await this._apiService.post("/api/v1/chats", { name });
            return {
                chatId: response.chatId,
                name: name,
            };
        }
        catch (error) {
            throw new Error("Failed to create chat");
        }
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map