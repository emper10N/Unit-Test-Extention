import axios, { AxiosInstance } from "axios";
import * as vscode from "vscode";

export class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private readonly _baseUrl = "http://localhost:5001";

  constructor(private readonly _context: vscode.ExtensionContext) {
    this.api = axios.create({
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

  public setToken(token: string) {
    this.token = token;
  }

  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post<T>(this._baseUrl + url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put<T>(this._baseUrl + url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      vscode.window.showErrorMessage(
        `API Error: ${error.response.data.message || "Unknown error"}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      vscode.window.showErrorMessage(
        "No response from server. Please check your connection."
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      vscode.window.showErrorMessage(`Request Error: ${error.message}`);
    }
  }
}
