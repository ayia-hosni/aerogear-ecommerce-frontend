import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { OrdersApi } from '../../core/api/orders.api';
import { Order } from '../../core/models/order.model';
import { LOADING, Loadable, toLoadable } from '../../core/utils/loadable';
import { AsyncState } from '../../shared/components/async-state';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, AsyncState, StatusBadge],
  template: `
    <h1 class="mb-8 px-2 text-[32px] leading-none font-black tracking-tight">My orders</h1>

    @let current = state();
    @if (current.status === 'ready') {
      @if (current.data.length) {
        <ul class="space-y-4">
          @for (order of current.data; track order.id) {
            <li>
              <a [routerLink]="['/orders', order.id]" class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 transition hover:shadow-lg">
                <div>
                  <p class="text-lg font-black">{{ order.number }}</p>
                  <p class="text-sm font-semibold text-gray-500">{{ order.createdAt | date: 'medium' }} · {{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <app-status-badge [status]="order.status" />
                  <span class="text-lg font-black">{{ order.total | currency }}</span>
                </div>
              </a>
            </li>
          }
        </ul>
      } @else {
        <div class="rounded-[32px] border border-gray-200 bg-white py-20 text-center">
          <p class="mb-5 font-semibold text-gray-600">You haven't placed any orders yet.</p>
          <a routerLink="/catalog" class="font-bold text-app-primary uppercase">Browse the catalog</a>
        </div>
      }
    } @else {
      <app-async-state [status]="current.status" [message]="current.status === 'error' ? current.message : ''" (retry)="reload.next()" />
    }
  `,
})
export class OrdersPage {
  private readonly api = inject(OrdersApi);
  protected readonly reload = new BehaviorSubject<void>(undefined);

  protected readonly state = toSignal(
    this.reload.pipe(switchMap(() => this.api.list().pipe(toLoadable()))),
    { initialValue: LOADING as Loadable<Order[]> },
  );
}
