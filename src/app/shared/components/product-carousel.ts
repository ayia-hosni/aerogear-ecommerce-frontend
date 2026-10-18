import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { AddToCartDirective } from '../directives/add-to-cart.directive';
import { ProductTransition } from '../services/product-transition.service';
import { tintFor } from '../theme/product-tint';

/**
 * Trending products: a heading column (projected content, category chips, arrows, position) beside a snap track.
 * The card nearest the track's left edge is lifted onto a coloured card; clicking it opens the product.
 * The card's colour, title, price and "+" are separate view-transition layers so they can travel into the detail page.
 */
@Component({
  selector: 'app-product-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, AddToCartDirective],
  host: { class: 'block' },
  styles: `
    /* Where the focused card rests: centred on phones, at the left edge of the track beside the heading on desktop. */
    .track {
      --pad: calc(50% - 130px);
      padding-inline: var(--pad) calc(100% - var(--pad) - 260px);
      scroll-padding-inline-start: var(--pad);
    }

    @media (min-width: 1024px) {
      .track {
        --pad: 20px;
      }
    }
  `,
  template: `
    <div class="grid items-center gap-x-10 gap-y-2 lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)]">
      <div class="flex flex-col gap-6 px-2 lg:px-0">
        <div><ng-content /></div>

        @if (categories().length > 1) {
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filter trending gear">
            <button type="button" class="carousel-chip" [class.on]="filter() === 'all'" (click)="setFilter('all')">All</button>
            @for (category of categories(); track category.slug) {
              <button type="button" class="carousel-chip" [class.on]="filter() === category.slug" (click)="setFilter(category.slug)">{{ category.name }}</button>
            }
          </div>
        }

        <div class="flex items-center gap-5">
          <div class="flex gap-2">
            <button type="button" aria-label="Previous product" class="carousel-arrow" [disabled]="focusedIndex() === 0" (click)="step(-1)">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button type="button" aria-label="Next product" class="carousel-arrow" [disabled]="focusedIndex() >= visible().length - 1" (click)="step(1)">
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div class="flex items-center gap-3 text-xs font-bold tracking-wider text-gray-500" aria-hidden="true">
            <span class="tabular-nums text-app-dark">{{ position() }}</span>
            <span class="h-1 w-24 overflow-hidden rounded-full bg-gray-200">
              <span class="block h-full rounded-full bg-app-dark transition-all duration-500" [style.width.%]="progress()"></span>
            </span>
            <span class="tabular-nums">{{ total() }}</span>
          </div>
        </div>
      </div>

      <div class="relative min-w-0 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-72px),transparent)]">
        <div
          #track
          class="track no-scrollbar relative flex snap-x snap-mandatory items-center gap-6 overflow-x-auto scroll-smooth pt-40 pb-14"
          role="list"
          aria-label="Trending gear"
          (scroll)="onScroll()"
        >
          @for (product of visible(); track product.id; let i = $index) {
            @let focused = i === focusedIndex();
            @let morphing = transition.active() === product.slug;
            @let tint = tintFor(product);
            <article
              role="listitem"
              data-item
              class="relative isolate h-[360px] w-[260px] shrink-0 snap-start rounded-[32px] border border-transparent p-6 pt-28 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              [class]="focused ? 'z-10 -translate-y-3 scale-105' : 'scale-90 text-app-dark opacity-70'"
              [style.color]="focused ? tint.ink : null"
            >
              <!-- Own layer so the colour can grow into the detail panel without dragging the card's text along. -->
              <div
                aria-hidden="true"
                class="absolute -inset-px -z-10 overflow-hidden rounded-[32px] border transition-colors duration-500 [container-type:inline-size]"
                [class]="focused ? 'border-transparent shadow-2xl' : 'border-gray-200 bg-white shadow-sm'"
                [style.background-color]="focused ? tint.background : null"
                [style.view-transition-name]="morphing ? 'product-surface' : null"
              >
                <span class="absolute top-[6%] left-1/2 -translate-x-1/2 text-[78cqw] leading-[0.8] font-extrabold text-white/10 select-none">{{ product.name[0] }}</span>
              </div>

              <div class="absolute top-4 right-4 left-4 flex items-center justify-between text-[11px] font-bold" aria-hidden="true">
                @if (product.badge) {
                  <span class="rounded-full px-2.5 py-1 tracking-wide uppercase" [class]="focused ? 'bg-white/20' : 'bg-gray-100 text-gray-600'">{{ product.badge }}</span>
                } @else {
                  <span></span>
                }
                <span class="flex items-center gap-1 rounded-full px-2.5 py-1" [class]="focused ? 'bg-white/20' : 'bg-gray-100 text-gray-600'">
                  <i class="fa-solid fa-star text-[10px] text-yellow-400"></i>{{ product.rating.toFixed(1) }}
                </span>
              </div>

              <a
                [routerLink]="['/products', product.slug]"
                class="absolute inset-0 z-10 rounded-[32px]"
                [attr.aria-label]="focused ? 'Open ' + product.name : 'Show ' + product.name"
                (click)="open($event, i, product)"
              ></a>
              <img
                [src]="product.imageUrl"
                [alt]="product.name"
                loading="lazy"
                class="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 object-contain drop-shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                [class]="focused ? 'scale-110 -rotate-6' : ''"
                [style.view-transition-name]="morphing ? 'product-image' : null"
              />
              <h3 class="mx-auto mt-2 w-fit max-w-full text-center text-[21px] leading-tight font-bold" [style.view-transition-name]="morphing ? 'product-title' : null">{{ product.name }}</h3>
              <p class="mt-1.5 line-clamp-2 text-center text-[13px] font-medium" [class]="(focused ? 'opacity-60' : 'text-gray-400') + (product.slug === returning ? ' vt-late' : '')">{{ product.summary }}</p>
              <div class="absolute right-6 bottom-6 left-6 flex items-center justify-between">
                <span class="text-[24px] font-black tracking-tight" [style.view-transition-name]="morphing ? 'product-price' : null">{{ product.price | currency }}</span>
                <button
                  type="button"
                  [appAddToCart]="product"
                  class="relative z-20 flex h-11 w-11 items-center justify-center text-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  [class]="focused ? '' : 'text-app-dark hover:text-white'"
                  [style.color]="focused ? tint.accentInk : null"
                >
                  <span
                    aria-hidden="true"
                    class="absolute inset-0 rounded-[14px] transition-colors"
                    [class]="focused ? '' : 'bg-gray-100'"
                    [style.background-color]="focused ? tint.accent : null"
                    [style.view-transition-name]="morphing ? 'product-add' : null"
                  ></span>
                  <i class="fa-solid fa-plus relative" [class.vt-late]="product.slug === returning"></i>
                </button>
              </div>
            </article>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductCarousel implements OnInit {
  readonly products = input.required<Product[]>();

  protected readonly tintFor = tintFor;
  protected readonly transition = inject(ProductTransition);
  protected readonly filter = signal('all');
  protected readonly focusedIndex = signal(0);
  /** Slug of the product we just came back from; its card's loose text waits for the panel to land. */
  protected readonly returning = this.transition.active();

  protected readonly categories = computed(() => {
    const seen = new Map<string, string>();
    for (const product of this.products()) {
      seen.set(product.categorySlug, product.categoryName);
    }
    return [...seen].map(([slug, name]) => ({ slug, name }));
  });
  protected readonly visible = computed(() =>
    this.filter() === 'all' ? this.products() : this.products().filter((product) => product.categorySlug === this.filter()),
  );
  protected readonly total = computed(() => String(this.visible().length).padStart(2, '0'));
  protected readonly position = computed(() => String(this.focusedIndex() + 1).padStart(2, '0'));
  protected readonly progress = computed(() => (this.visible().length ? ((this.focusedIndex() + 1) / this.visible().length) * 100 : 0));

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      // Coming back from a product page: bring its card to the resting spot before the morph lands on it.
      if (this.focusedIndex() > 0) {
        this.centre(this.focusedIndex(), 'instant');
      }
      this.updateFocus();
    });
  }

  ngOnInit(): void {
    const slug = this.transition.active();
    const index = this.products().findIndex((product) => product.slug === slug);
    this.focusedIndex.set(Math.max(index, 0));
  }

  protected setFilter(slug: string): void {
    this.filter.set(slug);
    this.focusedIndex.set(0);
    this.track().nativeElement.scrollTo({ left: 0, behavior: 'instant' });
  }

  protected onScroll(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.updateFocus());
  }

  protected open(event: Event, index: number, product: Product): void {
    if (index !== this.focusedIndex()) {
      event.preventDefault();
      this.centre(index);
      return;
    }
    this.transition.open(product);
  }

  protected step(delta: number): void {
    const last = this.visible().length - 1;
    this.centre(Math.min(Math.max(this.focusedIndex() + delta, 0), last));
  }

  private items(): HTMLElement[] {
    return Array.from(this.track().nativeElement.querySelectorAll<HTMLElement>('[data-item]'));
  }

  /** Space before the first card, i.e. where a focused card rests. */
  private restingOffset(): number {
    return parseFloat(getComputedStyle(this.track().nativeElement).paddingLeft) || 0;
  }

  private centre(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const item = this.items()[index];
    if (item) {
      this.track().nativeElement.scrollTo({ left: item.offsetLeft - this.restingOffset(), behavior });
    }
  }

  private updateFocus(): void {
    const start = this.track().nativeElement.scrollLeft + this.restingOffset();
    let nearest = 0;
    let best = Infinity;
    this.items().forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - start);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    this.focusedIndex.set(nearest);
  }
}
