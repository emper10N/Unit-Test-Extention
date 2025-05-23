import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgTemplateOutlet } from '@angular/common';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';

@Component({
  selector: 'app-authorization',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UserRegisterComponent,
    UserLoginComponent,
  ],
  templateUrl: 'authorization.component.html',
})
export class UserAuthorizationComponent {}
