import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Stepping between products happens inside the page (button transitions), so skip the page-level morph.
      withViewTransitions({
        onViewTransitionCreated: ({ transition, from, to }) => {
          const leaf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
            snapshot.firstChild ? leaf(snapshot.firstChild) : snapshot;
          const source = leaf(from).routeConfig;
          if (source?.path === 'products/:slug' && source === leaf(to).routeConfig) {
            transition.skipTransition();
          }
        },
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, unauthorizedInterceptor])),
  ],
};
