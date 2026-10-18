import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { readJson, removeKey, writeJson } from '../utils/storage';

const STORAGE_KEY = 'aerogear.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly session = signal<AuthResponse | null>(this.restore());

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.login(request).pipe(tap((response) => this.start(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.register(request).pipe(tap((response) => this.start(response)));
  }

  socialLogin(idToken: string): Observable<AuthResponse> {
    return this.api.firebase(idToken).pipe(tap((response) => this.start(response)));
  }

  logout(redirect = true): void {
    this.session.set(null);
    removeKey(STORAGE_KEY);
    if (redirect) {
      void this.router.navigateByUrl('/');
    }
  }

  private start(response: AuthResponse): void {
    this.session.set(response);
    writeJson(STORAGE_KEY, response);
  }

  private restore(): AuthResponse | null {
    const stored = readJson<AuthResponse>(STORAGE_KEY);
    if (!stored || new Date(stored.expiresAt).getTime() <= Date.now()) {
      removeKey(STORAGE_KEY);
      return null;
    }
    return stored;
  }
}
