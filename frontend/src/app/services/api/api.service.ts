import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser } from '../../interfaces/user.interface';
import { IRequest } from '../../interfaces/request.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private _loginUrl: string = 'http://localhost:5001/api/v1/auth/login';
  private _registerUrl: string = 'http://localhost:5001/api/v1/users';

  constructor(private httpClient: HttpClient) {}

  public registerUser(user: IUser): Observable<IRequest> {
    return this.httpClient.post<IRequest>(this._registerUrl, user);
  }

  public loginUser(user: IUser): Observable<IRequest> {
    return this.httpClient.post<IRequest>(this._loginUrl, user);
  }
}
