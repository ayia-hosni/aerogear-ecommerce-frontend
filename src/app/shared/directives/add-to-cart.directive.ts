import { Directive, ElementRef, HostListener, computed, inject, input } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { CartOptions, CartStore } from '../../core/state/cart.store';
import { CartFlightService } from '../services/cart-flight.service';

@Directive({
  selector: '[appAddToCart]',
  host: {
    '[attr.disabled]': 'unavailable() ? "" : null',
    '[attr.aria-label]': '"Add " + product().name + " to bag"',
  },
})
export class AddToCartDirective {
  readonly product = input.required<Product>({ alias: 'appAddToCart' });
  readonly quantity = input(1, { alias: 'appAddToCartQuantity' });
  readonly options = input<CartOptions>({}, { alias: 'appAddToCartOptions' });

  protected readonly unavailable = computed(() => this.product().stock < 1);

  private readonly cart = inject(CartStore);
  private readonly flight = inject(CartFlightService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('click', ['$event'])
  protected onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.unavailable()) {
      return;
    }

    this.cart.add(this.product(), this.quantity(), this.options());
    this.flight.launch(this.element.nativeElement);
  }
}
