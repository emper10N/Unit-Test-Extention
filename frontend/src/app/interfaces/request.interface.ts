export interface IRequest {
  userId: string;
  accessToken: string;
}

export interface IUserData {
  userId: string;
  username: string;
  password: string;
}

export interface IUserInfo {
  username: string;
  email: string;
}

export interface IChat {
  name: string;
}

export interface IMessage {
  model: string;
  chatId: string;
  message: string;
}

export interface IChatId {
  chatId: string;
}

export interface IContent {
  content: string;
}
