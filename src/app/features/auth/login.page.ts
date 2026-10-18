import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SocialLoginButtons } from './social-login-buttons';
import { AuthStore } from '../../core/state/auth.store';
import { describeHttpError } from '../../core/utils/http-error';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SocialLoginButtons],
  template: `
    <section class="mx-auto max-w-md rounded-[32px] border border-gray-200 bg-white p-8 shadow-soft md:p-10">
      <h1 class="mb-2 text-3xl font-black tracking-tight">Welcome back</h1>
      <p class="mb-8 font-medium text-gray-500">Sign in to track orders and check out faster.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
        <label class="block">
          <span class="mb-1.5 block text-sm font-bold">Email</span>
          <input type="email" formControlName="email" autocomplete="email" class="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-app-primary" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="mt-1 block text-sm text-red-600">Enter a valid email address.</span>
          }
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-bold">Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" class="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-app-primary" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="mt-1 block text-sm text-red-600">Password is required.</span>
          }
        </label>

        @if (error(); as message) {
          <p class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{{ message }}</p>
        }

        <button type="submit" [disabled]="submitting()" class="w-full rounded-2xl bg-app-dark py-4 font-black tracking-widest text-white uppercase transition hover:bg-gray-800 disabled:opacity-60">
          {{ submitting() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <app-social-login-buttons [returnUrl]="returnUrl()" />

      <p class="mt-6 text-center font-medium text-gray-500">
        New here? <a routerLink="/register" [queryParams]="{ returnUrl: returnUrl() }" class="font-bold text-app-primary">Create an account</a>
      </p>
    </section>
  `,
})
export class LoginPage {
  readonly returnUrl = input<string>('/');

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (error: unknown) => {
        this.error.set(describeHttpError(error));
        this.submitting.set(false);
      },
    });
  }
}
