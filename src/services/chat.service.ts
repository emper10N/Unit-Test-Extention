import * as vscode from "vscode";
import { ApiService } from "./api.service";

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  timestamp: string;
  type: "text" | "code" | "test";
  metadata?: {
    language?: string;
    testId?: string;
  };
}

export class ChatService {
  constructor(private apiService: ApiService) {}

  public async getMessages(
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    return this.apiService.get<Message[]>("/chat/messages", {
      limit,
      before,
    });
  }

  public async sendMessage(
    content: string,
    type: Message["type"] = "text",
    metadata?: Message["metadata"]
  ): Promise<Message> {
    return this.apiService.post<Message>("/chat/messages", {
      content,
      type,
      metadata,
    });
  }

  public async sendCodeMessage(
    code: string,
    language: string
  ): Promise<Message> {
    return this.sendMessage(code, "code", { language });
  }

  public async sendTestMessage(testId: string): Promise<Message> {
    return this.sendMessage("Test shared", "test", { testId });
  }

  public async deleteMessage(messageId: string): Promise<void> {
    await this.apiService.delete(`/chat/messages/${messageId}`);
  }

  public async editMessage(
    messageId: string,
    content: string
  ): Promise<Message> {
    return this.apiService.put<Message>(`/chat/messages/${messageId}`, {
      content,
    });
  }

  public async getMessage(messageId: string): Promise<Message> {
    return this.apiService.get<Message>(`/chat/messages/${messageId}`);
  }

  public async searchMessages(query: string): Promise<Message[]> {
    return this.apiService.get<Message[]>("/chat/messages/search", {
      query,
    });
  }
}
