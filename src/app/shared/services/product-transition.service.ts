import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Product } from '../../core/models/product.model';

/**
 * Tracks which product is morphing between a list card and its detail page.
 * Only that product's elements get a `view-transition-name`, because the names must be unique per page.
 */
@Injectable({ providedIn: 'root' })
export class ProductTransition {
  readonly active = signal<string | null>(null);
  /** Whether the panel on the open product page is dark (white logo over it) or light. */
  readonly panelLight = signal(true);
  /** The product that was clicked, so its page can render before the API answers (the morph needs content at once). */
  readonly product = signal<Product | null>(null);

  open(product: Product): void {
    this.product.set(product);
    this.active.set(product.slug);
  }

  constructor() {
    // Opening a product from somewhere else (e.g. a link) must not morph from a stale card.
    inject(Router).events.subscribe((event) => {
      if (!(event instanceof NavigationStart)) {
        return;
      }
      const target = /^\/products\/([^/?#]+)/.exec(event.url)?.[1];
      if (target && decodeURIComponent(target) !== this.active()) {
        this.active.set(null);
      }
    });
  }
}
