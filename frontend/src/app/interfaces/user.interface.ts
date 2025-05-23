import { Observable } from 'rxjs';
import { IRequest } from './request.interface';

export interface IUser {
  username: string;
  password: string;
  email: string;
}

export interface IUserInterface {
  Login: (credentials: IUser) => Observable<IRequest>;
  LogOut: () => void;
  Register: (credentials: IUser) => Observable<IRequest>;
  isAuthorized: () => boolean;
}
