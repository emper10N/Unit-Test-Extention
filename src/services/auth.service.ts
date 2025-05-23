import * as vscode from "vscode";
import { ApiService } from "./api.service";

export interface User {
  userId: string;
  username: string;
}

interface AuthResponse {
  userId: string;
  accessToken: string;
}

export class AuthService {
  private _currentUser: User | null = null;
  private _token: string | null = null;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._token = this._context.globalState.get("token") || null;
    if (this._token) {
      this._apiService.setToken(this._token);
    }
  }

  public async register(username: string, password: string): Promise<void> {
    try {
      const response = await this._apiService.post<AuthResponse>(
        "/api/v1/users",
        {
          username,
          password,
        }
      );

      this._apiService.setToken(response.accessToken);
      this._currentUser = {
        userId: response.userId,
        username: username,
      };

      await this._context.globalState.update("token", response.accessToken);
    } catch (error) {
      throw new Error("Failed to register: " + (error as Error).message);
    }
  }

  public async login(username: string, password: string): Promise<void> {
    try {
      const response = await this._apiService.post<AuthResponse>(
        "/api/v1/auth/login",
        {
          username,
          password,
        }
      );

      this._apiService.setToken(response.accessToken);
      this._currentUser = {
        userId: response.userId,
        username: username,
      };

      // Store token in extension's global state
      await this._context.globalState.update("token", response.accessToken);
    } catch (error) {
      throw new Error("Failed to login: " + (error as Error).message);
    }
  }

  public async logout(): Promise<void> {
    try {
      this._apiService.setToken("");
      await this._context.globalState.update("token", undefined);
    } catch (error) {
      throw new Error("Failed to logout: " + (error as Error).message);
    }
  }

  public async checkAuth(): Promise<boolean> {
    try {
      const token = this._context.globalState.get<string>("token");
      if (!token) {
        return false;
      }

      this._apiService.setToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  public getCurrentUser(): User | null {
    return this._currentUser;
  }

  public isAuthenticated(): boolean {
    return this._token !== null;
  }
}
