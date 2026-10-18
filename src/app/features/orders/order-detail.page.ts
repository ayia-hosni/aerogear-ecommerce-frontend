import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, switchMap } from 'rxjs';
import { OrdersApi } from '../../core/api/orders.api';
import { Order } from '../../core/models/order.model';
import { LOADING, Loadable, toLoadable } from '../../core/utils/loadable';
import { AsyncState } from '../../shared/components/async-state';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-order-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, AsyncState, StatusBadge],
  template: `
    @if (placed()) {
      <div class="mb-8 rounded-3xl bg-green-50 p-6 text-green-800" role="status">
        <p class="text-xl font-black">Order placed 🎉</p>
        <p class="font-medium">Thanks for your purchase. We'll get it moving right away.</p>
      </div>
    }

    <a routerLink="/orders" class="mb-6 inline-flex items-center gap-2 font-semibold text-gray-500 hover:text-app-dark">
      <i class="fa-solid fa-arrow-left"></i> All orders
    </a>

    @let current = state();
    @if (current.status === 'ready') {
      @let order = current.data;
      <article class="rounded-[32px] border border-gray-200 bg-white p-6 shadow-soft md:p-10">
        <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black tracking-tight">{{ order.number }}</h1>
            <p class="font-semibold text-gray-500">{{ order.createdAt | date: 'medium' }}</p>
          </div>
          <app-status-badge [status]="order.status" />
        </header>

        <ul class="divide-y divide-gray-100">
          @for (line of order.items; track line.productId) {
            <li class="flex items-center justify-between gap-4 py-4">
              <div>
                <p class="font-bold">{{ line.productName }}</p>
                <p class="text-sm font-semibold text-gray-500">{{ line.quantity }} × {{ line.unitPrice | currency }}</p>
              </div>
              <span class="font-bold">{{ line.lineTotal | currency }}</span>
            </li>
          }
        </ul>

        <div class="mt-4 flex justify-between border-t border-gray-200 pt-4 text-xl font-black">
          <span>Total</span><span>{{ order.total | currency }}</span>
        </div>

        <section class="mt-8">
          <h2 class="mb-2 font-black">Shipping to</h2>
          <address class="font-medium text-gray-600 not-italic">
            {{ order.shippingAddress.fullName }}<br />
            {{ order.shippingAddress.line1 }}<br />
            @if (order.shippingAddress.line2) { {{ order.shippingAddress.line2 }}<br /> }
            {{ order.shippingAddress.city }}, {{ order.shippingAddress.postalCode }}<br />
            {{ order.shippingAddress.country }}
          </address>
        </section>
      </article>
    } @else {
      <app-async-state [status]="current.status" [message]="current.status === 'error' ? current.message : ''" (retry)="reload.next()" />
    }
  `,
})
export class OrderDetailPage {
  readonly id = input.required<string>();
  readonly placed = input(false, { transform: (value: unknown) => value === true || value === 'true' });

  private readonly api = inject(OrdersApi);
  protected readonly reload = new BehaviorSubject<void>(undefined);

  protected readonly state = toSignal(
    combineLatest([toObservable(this.id), this.reload]).pipe(
      switchMap(([id]) => this.api.get(id).pipe(toLoadable())),
    ),
    { initialValue: LOADING as Loadable<Order> },
  );
}
