import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuth, SocialProvider } from '../../core/api/firebase-auth';
import { AuthStore } from '../../core/state/auth.store';
import { describeHttpError } from '../../core/utils/http-error';

const CLOSED_BY_USER = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

@Component({
  selector: 'app-social-login-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="my-6 flex items-center gap-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
      <span class="h-px flex-1 bg-gray-200"></span>or<span class="h-px flex-1 bg-gray-200"></span>
    </div>

    <div class="space-y-3">
      <button type="button" (click)="signIn('google')" [disabled]="busy()" class="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 py-3.5 font-bold transition hover:bg-gray-50 disabled:opacity-60">
        <i class="fa-brands fa-google"></i> Continue with Google
      </button>
      <button type="button" (click)="signIn('facebook')" [disabled]="busy()" class="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 py-3.5 font-bold transition hover:bg-gray-50 disabled:opacity-60">
        <i class="fa-brands fa-facebook text-[#1877f2]"></i> Continue with Facebook
      </button>
    </div>

    @if (error(); as message) {
      <p class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{{ message }}</p>
    }
  `,
})
export class SocialLoginButtons {
  readonly returnUrl = input<string>('/');

  private readonly firebase = inject(FirebaseAuth);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async signIn(provider: SocialProvider): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      const idToken = await this.firebase.signIn(provider);
      this.auth.socialLogin(idToken).subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (error: unknown) => this.fail(describeHttpError(error)),
      });
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      this.fail(CLOSED_BY_USER.includes(code) ? null : this.describe(error, code));
    }
  }

  private describe(error: unknown, code: string): string {
    if (code === 'auth/account-exists-with-different-credential') {
      return 'An account already exists with this email. Sign in with the provider you used before.';
    }
    return error instanceof Error && !code ? error.message : 'Social sign-in failed. Please try again.';
  }

  private fail(message: string | null): void {
    this.error.set(message);
    this.busy.set(false);
  }
}
