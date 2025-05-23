"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
class AuthService {
    constructor(_apiService, _context) {
        this._apiService = _apiService;
        this._context = _context;
        this._currentUser = null;
        this._token = null;
        this._token = this._context.globalState.get("token") || null;
        if (this._token) {
            this._apiService.setToken(this._token);
        }
    }
    async register(username, password) {
        try {
            const response = await this._apiService.post("/api/v1/users", {
                username,
                password,
            });
            this._apiService.setToken(response.accessToken);
            this._currentUser = {
                userId: response.userId,
                username: username,
            };
            await this._context.globalState.update("token", response.accessToken);
        }
        catch (error) {
            throw new Error("Failed to register: " + error.message);
        }
    }
    async login(username, password) {
        try {
            const response = await this._apiService.post("/api/v1/auth/login", {
                username,
                password,
            });
            this._apiService.setToken(response.accessToken);
            this._currentUser = {
                userId: response.userId,
                username: username,
            };
            // Store token in extension's global state
            await this._context.globalState.update("token", response.accessToken);
        }
        catch (error) {
            throw new Error("Failed to login: " + error.message);
        }
    }
    async logout() {
        try {
            this._apiService.setToken("");
            await this._context.globalState.update("token", undefined);
        }
        catch (error) {
            throw new Error("Failed to logout: " + error.message);
        }
    }
    async checkAuth() {
        try {
            const token = this._context.globalState.get("token");
            if (!token) {
                return false;
            }
            this._apiService.setToken(token);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    getCurrentUser() {
        return this._currentUser;
    }
    isAuthenticated() {
        return this._token !== null;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map