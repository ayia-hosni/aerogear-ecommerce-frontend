import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OrderStatus } from '../../core/models/order.model';

const STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Paid: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase {{ style() }}">{{ status() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
  protected readonly style = computed(() => STYLES[this.status()]);
}
