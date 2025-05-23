import { Component, inject, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgTemplateOutlet } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { UserManagementService } from '../../services/user-management-service/user-management.service';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, CommonModule, FormsModule],
  templateUrl: 'header.component.html',
  styleUrl: 'style/header.main.scss',
})
export class HeaderComponent {
  public authService: AuthService = inject(AuthService);
  public http: HttpClient = inject(HttpClient);
  public userData: UserManagementService = inject(UserManagementService);
  constructor(private router: Router, public themeService: ThemeService) {}

  public async openRegister() {
    await this.router.navigate(['/registration']);
  }

  public async openLogin(): Promise<void> {
    await this.router.navigate(['/login']);
  }

  public async openMain(): Promise<void> {
    await this.router.navigate(['/home']);
  }

  public async openProfile(): Promise<void> {
    await this.router.navigate(['/profile']);
  }
}
