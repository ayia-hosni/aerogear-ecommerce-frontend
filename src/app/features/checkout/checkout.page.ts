import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrdersApi } from '../../core/api/orders.api';
import { AuthStore } from '../../core/state/auth.store';
import { CartStore } from '../../core/state/cart.store';
import { describeHttpError } from '../../core/utils/http-error';

@Component({
  selector: 'app-checkout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.page.html',
})
export class CheckoutPage {
  private readonly ordersApi = inject(OrdersApi);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  protected readonly cart = inject(CartStore);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: [this.auth.user()?.fullName ?? '', [Validators.required, Validators.maxLength(100)]],
    line1: ['', [Validators.required, Validators.maxLength(200)]],
    line2: [''],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
  });

  constructor() {
    effect(() => {
      if (this.cart.isEmpty() && !this.submitting()) {
        void this.router.navigateByUrl('/cart');
      }
    });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { line2, ...address } = this.form.getRawValue();

    this.ordersApi
      .create({
        items: this.cart.items().map(({ productId, quantity }) => ({ productId, quantity })),
        shippingAddress: { ...address, line2: line2.trim() || null },
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          void this.router.navigate(['/orders', order.id], { queryParams: { placed: true } });
        },
        error: (error: unknown) => {
          this.error.set(describeHttpError(error));
          this.submitting.set(false);
        },
      });
  }
}
