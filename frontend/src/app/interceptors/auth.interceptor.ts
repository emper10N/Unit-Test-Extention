import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('token') ?? '';
  request = request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(request);
};
