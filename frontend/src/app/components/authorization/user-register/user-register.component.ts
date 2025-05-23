import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgIf, NgTemplateOutlet } from '@angular/common';
import { CustomValidators } from '../../../services/custom-validator/custom-validator.service';
import { ValidatorsHandlerComponent } from '../../../validators-handler/validators-handler.component';
import { InputControlComponent } from '../../input-control/input-control.component';
import { AuthService } from '../../../services/auth/auth.service';
import { IUser } from '../../../interfaces/user.interface';
import { IRequest, IUserData } from '../../../interfaces/request.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '../../../services/theme/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    CommonModule,
    ValidatorsHandlerComponent,
    InputControlComponent,
  ],
  templateUrl: 'user-register.component.html',
  styleUrl: 'styles/register.main.scss',
})
export class UserRegisterComponent implements OnInit {
  registerForm!: FormGroup;
  user!: IUser;
  private _authService: AuthService = inject(AuthService);
  private _destroyRef: DestroyRef = inject(DestroyRef);
  private _router: Router = inject(Router);

  constructor(
    private formBuilder: FormBuilder,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group(
      {
        username: ['', Validators.required],
        email: ['', [Validators.required, CustomValidators.emailValidator]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(32),
            CustomValidators.uppercaseValidator,
            CustomValidators.specialCharacterValidator,
            CustomValidators.lowercaseValidator,
          ],
        ],
        passwordConfirm: ['', Validators.required],
      },
      {
        validators: CustomValidators.matchValidator(
          'password',
          'passwordConfirm'
        ),
      }
    );
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    this.user = {
      username: this.registerForm.get('username')?.value,
      password: this.registerForm.get('password')?.value,
      email: this.registerForm.get('email')?.value,
    };
    this._authService
      .register(this.user)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((res: IRequest) => {
        this._authService.setToken(res.accessToken);
        const data: IUserData = {
          username: this.registerForm.get('username')?.value,
          password: this.registerForm.get('password')?.value,
          userId: res.userId,
        };
        this._authService.setData(data);
        this._router.navigateByUrl('/new-chat');
      });
  }

  onReset() {
    this.registerForm.reset();
  }

  public async openLogin(): Promise<void> {
    await this._router.navigate(['/login']);
  }
}
