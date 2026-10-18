import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../config/api-url';

export type SocialProvider = 'google' | 'facebook';

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

/** Wraps the Firebase JS SDK; it is imported on demand so it stays out of the main bundle. */
@Injectable({ providedIn: 'root' })
export class FirebaseAuth {
  private readonly http = inject(HttpClient);
  private readonly configUrl = `${inject(API_URL)}/config/firebase`;
  private config?: Promise<FirebaseWebConfig>;

  /** Opens the provider's popup and returns a Firebase ID token for the backend to verify. */
  async signIn(provider: SocialProvider): Promise<string> {
    const [config, { initializeApp, getApps }, auth] = await Promise.all([
      this.loadConfig(),
      import('firebase/app'),
      import('firebase/auth'),
    ]);

    const app = getApps()[0] ?? initializeApp(config);
    const authInstance = auth.getAuth(app);
    const authProvider =
      provider === 'google' ? new auth.GoogleAuthProvider() : new auth.FacebookAuthProvider();
    authProvider.addScope('email');

    const credential = await auth.signInWithPopup(authInstance, authProvider);
    const token = await credential.user.getIdToken();

    // The app keeps its own session (JWT); the Firebase one is only needed for this exchange.
    await auth.signOut(authInstance);
    return token;
  }

  private loadConfig(): Promise<FirebaseWebConfig> {
    this.config ??= firstValueFrom(this.http.get<FirebaseWebConfig>(this.configUrl)).catch(() => {
      this.config = undefined;
      throw new Error('Social sign-in is not configured yet.');
    });
    return this.config;
  }
}
