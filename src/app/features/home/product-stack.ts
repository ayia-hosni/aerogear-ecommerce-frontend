import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { AddToCartDirective } from '../../shared/directives/add-to-cart.directive';
import { ProductTransition } from '../../shared/services/product-transition.service';
import { CARD_THEMES } from '../../shared/theme/product-theme';

const TRANSITION_MS = 600;
const VISIBLE_POSITIONS = 6;

@Component({
  selector: 'app-product-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, AddToCartDirective],
  templateUrl: './product-stack.html',
  styleUrl: './product-stack.css',
})
export class ProductStack {
  readonly products = input.required<Product[]>();

  protected readonly themes = CARD_THEMES;
  protected readonly transition = inject(ProductTransition);
  private readonly order = signal<number[]>([]);
  private readonly leaving = signal<number | null>(null);
  private readonly snapping = signal<number | null>(null);
  private animating = false;

  protected readonly cards = computed(() => {
    const products = this.products();
    const order = this.syncedOrder(products.length);
    return products.map((product, index) => ({
      product,
      titleLines: this.splitTitle(product.name),
      positionClass: this.positionClass(index, order),
      isTop: order[0] === index,
      isFinal: index === products.length - 1,
      isSnapping: this.snapping() === index,
    }));
  });

  protected next(): void {
    const order = this.syncedOrder(this.products().length);
    if (this.animating || order.length < 2) {
      return;
    }

    this.animating = true;
    this.leaving.set(order[0]);
    this.order.set(order.slice(1));

    setTimeout(() => {
      this.snapping.set(order[0]);
      this.order.set([...order.slice(1), order[0]]);
      this.leaving.set(null);
      this.animating = false;
      requestAnimationFrame(() => requestAnimationFrame(() => this.snapping.set(null)));
    }, TRANSITION_MS);
  }

  private syncedOrder(length: number): number[] {
    const current = this.order();
    return current.length === length ? current : Array.from({ length }, (_, index) => index);
  }

  private positionClass(index: number, order: number[]): string {
    if (this.leaving() === index) {
      return 'pos-out';
    }
    const position = order.indexOf(index);
    if (position < 0) {
      return 'pos-hidden';
    }
    return `pos-${Math.min(position, VISIBLE_POSITIONS - 1)}`;
  }

  private splitTitle(name: string): [string, string] {
    const [first, ...rest] = name.split(' ');
    return [first, rest.join(' ')];
  }
}
