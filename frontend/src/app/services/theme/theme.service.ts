import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  private darkTheme = false;

  constructor() {
    this.initializeTheme();
  }

  isDarkTheme(): boolean {
    return this.darkTheme;
  }

  toggleTheme(): void {
    this.darkTheme = !this.darkTheme;
    this.applyTheme();
    this.saveTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);

    if (savedTheme) {
      this.darkTheme = savedTheme === 'dark';
    } else {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkTheme = prefersDark;
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.darkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  private saveTheme(): void {
    localStorage.setItem(this.THEME_KEY, this.darkTheme ? 'dark' : 'light');
  }
}
