import { Component, inject, NgModule, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgIf, NgTemplateOutlet } from '@angular/common';
import { ApiService } from '../../services/api/api.service';
import { UserManagementService } from '../../services/user-management-service/user-management.service';
import { Observable, Subscription, tap } from 'rxjs';
import {
  IChat,
  IUserData,
  IUserInfo,
} from '../../interfaces/request.interface';
import { HttpClient } from '@angular/common/http';
import { CustomValidators } from '../../services/custom-validator/custom-validator.service';
import { InputControlComponent } from '../input-control/input-control.component';
import { ValidatorsHandlerComponent } from '../../validators-handler/validators-handler.component';
import { IUser } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth/auth.service';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { TransportResponseService } from '../../services/transport-response/transport-response.service';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    ValidatorsHandlerComponent,
  ],
  templateUrl: 'profile-page.component.html',
  styleUrl: 'style/profile-page.main.scss',
})
export class ProfilePageComponent implements OnInit {
  public userData: UserManagementService = inject(UserManagementService);
  private _auth: AuthService = inject(AuthService);
  private _userUrl: string = `http://localhost:5001/api/v1/users/${
    this.userData.getUserData()?.userId
  }`;
  private _userChatsUrl: string = `http://localhost:5001/api/v1/chats`;
  private _getAnsver: string = `http://localhost:5001/api/v1/chats/`;
  public chats!: any[];
  public changeUserInfoForm!: FormGroup;
  private user!: IUser;
  public changeUser: boolean = false;

  constructor(
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private transportResponse: TransportResponseService,
    public themeService: ThemeService
  ) {
    this.changeUserInfoForm = this.formBuilder.group({
      username: ['username', Validators.required],
      email: [
        'email@gmail.com',
        [Validators.required, CustomValidators.emailValidator],
      ],
      password: [
        'password',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(32),
          CustomValidators.uppercaseValidator,
          CustomValidators.specialCharacterValidator,
          CustomValidators.lowercaseValidator,
        ],
      ],
    });
    this.getChatsInfo();
  }

  public changeUserInfo() {
    this.changeUserInfoForm.controls['username'].enable();
    this.changeUserInfoForm.controls['email'].enable();
    this.changeUserInfoForm.controls['password'].enable();
    this.changeUser = true;
  }

  public cancel() {
    this.changeUser = false;
    this.changeUserInfoForm.controls['username'].disable();
    this.changeUserInfoForm.controls['email'].disable();
    this.changeUserInfoForm.controls['password'].disable();
  }

  onSubmit() {
    this.user = {
      username: this.changeUserInfoForm.get('username')?.value,
      password: this.changeUserInfoForm.get('password')?.value,
      email: this.changeUserInfoForm.get('email')?.value,
    };
    this.updateUserInfo(this.user);
    this.changeUser = false;
    this.changeUserInfoForm.controls['username'].disable();
    this.changeUserInfoForm.controls['email'].disable();
    this.changeUserInfoForm.controls['password'].disable();
  }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData(): Promise<void> {
    try {
      const str: IUserData = JSON.parse(localStorage.getItem('data')!);
      this.changeUserInfoForm.patchValue({
        username: str.username,
        email: '',
        password: str.password,
      });
      this.changeUserInfoForm.controls['username'].disable();
      this.changeUserInfoForm.controls['email'].disable();
      this.changeUserInfoForm.controls['password'].disable();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  public getChatsInfo(): Subscription {
    return this.httpClient.get<any>(this._userChatsUrl).subscribe((res) => {
      this.chats = res.chats;
    });
  }

  public updateUserInfo(user: IUser): Subscription {
    return this.httpClient
      .put<IUserData>(this._userUrl, user)
      .subscribe((res) => {
        const data: IUserData = {
          username: res.username,
          userId: res.userId,
          password: user.password,
        };
        this._auth.setData(data);
      });
  }

  public goToMessage(chatId: string) {
    this.httpClient
      .get<any>(this._getAnsver + chatId + '/messages')
      .pipe(
        tap((res) => {
          this.transportResponse.changeCode(
            res.messages[res.messages.length - 1].content
          );
          this.router.navigate(['/response'], {
            queryParams: { id: chatId },
          });
        })
      )
      .subscribe(
        () => {},
        (error) => {
          console.error('Ошибка при получении ответа:', error);
        }
      );
  }
}
