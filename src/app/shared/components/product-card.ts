import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { AddToCartDirective } from '../directives/add-to-cart.directive';
import { ProductTransition } from '../services/product-transition.service';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, AddToCartDirective],
  host: { class: 'block' },
  template: `
    <article
      class="group relative isolate h-full rounded-[32px] border border-gray-200 p-6 pt-24 shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      <div
        aria-hidden="true"
        class="absolute inset-0 -z-10 rounded-[32px] bg-white"
        [style.view-transition-name]="morphing() ? 'product-surface' : null"
      ></div>
      <a [routerLink]="['/products', product().slug]" class="absolute inset-0 z-10 rounded-[32px]" [attr.aria-label]="product().name" (click)="transition.open(product())"></a>
      <img
        [src]="product().imageUrl"
        [alt]="product().name"
        loading="lazy"
        class="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 object-contain drop-shadow-xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-3 group-hover:scale-110"
        [style.view-transition-name]="morphing() ? 'product-image' : null"
      />
      <div class="absolute top-5 right-5 flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-gray-700">
        <i class="fa-solid fa-star text-[11px] text-yellow-500"></i>
        <span class="text-[13px] font-bold">{{ product().rating.toFixed(1) }}</span>
      </div>
      <h3 class="mx-auto mt-2 w-fit text-center text-[22px] font-bold text-app-dark" [style.view-transition-name]="morphing() ? 'product-title' : null">{{ product().name }}</h3>
      <p class="mt-1.5 text-center text-[14px] font-medium text-gray-400">{{ product().summary }}</p>
      <div class="mt-8 flex items-center justify-between">
        <span class="text-[24px] font-black tracking-tight text-app-dark" [style.view-transition-name]="morphing() ? 'product-price' : null">{{ product().price | currency }}</span>
        <button
          type="button"
          [appAddToCart]="product()"
          class="relative z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg text-app-dark transition-all hover:bg-app-primary hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();

  protected readonly transition = inject(ProductTransition);
  protected readonly morphing = computed(() => this.transition.active() === this.product().slug);
}
