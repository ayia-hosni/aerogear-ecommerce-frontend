import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, filter, map, of, startWith } from 'rxjs';
import { CategoriesApi } from '../core/api/categories.api';
import { AuthStore } from '../core/state/auth.store';
import { CartStore } from '../core/state/cart.store';
import { CartFlightService } from '../shared/services/cart-flight.service';
import { ProductTransition } from '../shared/services/product-transition.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header {
  private readonly router = inject(Router);
  private readonly flight = inject(CartFlightService);
  protected readonly auth = inject(AuthStore);
  protected readonly cart = inject(CartStore);

  protected readonly categories = toSignal(
    inject(CategoriesApi).list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly navCategories = computed(() => this.categories().slice(0, 3));
  protected readonly impact = this.flight.impact;
  protected readonly menuOpen = signal(false);

  /** On a product page the coloured panel sits under the header, so the nav steps aside and the logo follows the panel's ink. */
  protected readonly overPanel = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      map((url) => url.startsWith('/products/')),
    ),
    { initialValue: false },
  );
  private readonly panelLight = inject(ProductTransition).panelLight;
  protected readonly logoClass = computed(() => (this.overPanel() ? (this.panelLight() ? 'text-white' : 'text-app-dark') : ''));
  protected readonly initials = computed(() =>
    (this.auth.user()?.fullName ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );

  private readonly cartButton = viewChild.required<ElementRef<HTMLElement>>('cartButton');

  constructor() {
    afterNextRender(() => this.flight.registerTarget(this.cartButton().nativeElement));
  }

  protected search(term: string): void {
    const search = term.trim();
    void this.router.navigate(['/catalog'], { queryParams: { search: search || null } });
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
