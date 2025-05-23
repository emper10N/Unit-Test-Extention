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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
class ApiService {
    constructor(_context) {
        this._context = _context;
        this.token = null;
        this._baseUrl = "http://localhost:5001";
        this.api = axios_1.default.create({
            baseURL: this._baseUrl,
            headers: {
                "Content-Type": "application/json",
            },
        });
        this.api.interceptors.request.use((config) => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
    }
    setToken(token) {
        this.token = token;
    }
    async get(url, params) {
        try {
            const response = await this.api.get(url, { params });
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    async post(url, data) {
        try {
            const response = await this.api.post(this._baseUrl + url, data);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    async put(url, data) {
        try {
            const response = await this.api.put(this._baseUrl + url, data);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    async delete(url) {
        try {
            const response = await this.api.delete(url);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            vscode.window.showErrorMessage(`API Error: ${error.response.data.message || "Unknown error"}`);
        }
        else if (error.request) {
            // The request was made but no response was received
            vscode.window.showErrorMessage("No response from server. Please check your connection.");
        }
        else {
            // Something happened in setting up the request that triggered an Error
            vscode.window.showErrorMessage(`Request Error: ${error.message}`);
        }
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=api.service.js.map