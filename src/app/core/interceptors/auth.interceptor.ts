import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../config/api-url';
import { AuthStore } from '../state/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).token();

  if (!token || !request.url.startsWith(inject(API_URL))) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
