import { CurrencyPipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { ProductsApi } from '../../core/api/products.api';
import { Product, ProductColor } from '../../core/models/product.model';
import { WishlistStore } from '../../core/state/wishlist.store';
import { LOADING, Loadable, toLoadable } from '../../core/utils/loadable';
import { SwapKind, swapLayers, wipeSwap } from '../../shared/animations/button-transitions';
import { AsyncState } from '../../shared/components/async-state';
import { AddToCartDirective } from '../../shared/directives/add-to-cart.directive';
import { ProductTransition } from '../../shared/services/product-transition.service';
import { tintFor } from '../../shared/theme/product-tint';

/** Other angles are the same picture moved around inside the stage (the catalogue has a single photo per product). */
const VIEWS = [
  { label: 'Side', transform: 'none' },
  { label: 'Other side', transform: 'scaleX(-1)' },
  { label: 'Upper detail', transform: 'scale(2) translate(10%, 18%)' },
  { label: 'Heel detail', transform: 'scale(2.1) translate(34%, -10%)' },
  { label: 'Toe detail', transform: 'scale(2.1) translate(-32%, -18%)' },
] as const;

const SHOWCASE_MS = 2400;
const ADDED_MS = 1400;

const hueFilter = (color: ProductColor | undefined): string =>
  color && color.hueShift !== 0 ? `hue-rotate(${color.hueShift}deg) saturate(1.25)` : 'none';

const firstAvailable = (product: Product | null): string | null =>
  product?.sizes.find((size) => !product.soldOutSizes.includes(size)) ?? null;

@Component({
  selector: 'app-product-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, AsyncState, AddToCartDirective],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.css', './product-options.css'],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class ProductDetailPage {
  readonly slug = input.required<string>();

  private readonly api = inject(ProductsApi);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly injector = inject(Injector);
  private readonly transition = inject(ProductTransition);
  private readonly reload = new BehaviorSubject<void>(undefined);
  protected readonly wishlist = inject(WishlistStore);

  protected readonly views = VIEWS;
  protected readonly quantity = signal(1);
  protected readonly view = signal(0);
  protected readonly moreViews = signal(false);
  protected readonly tab = signal<'overview' | 'details'>('overview');
  /** True while a button transition runs, so clicks can't overlap. */
  protected readonly busy = signal(false);
  protected readonly added = signal(false);
  protected readonly playing = signal(false);

  private readonly fetched = toSignal(
    combineLatest([toObservable(this.slug), this.reload]).pipe(
      switchMap(([slug]) => {
        this.quantity.set(1);
        return this.api.getBySlug(slug).pipe(toLoadable());
      }),
    ),
    { initialValue: LOADING as Loadable<Product> },
  );

  /** The clicked card's product stands in until the API answers, so the morph never starts from a spinner. */
  private readonly state = computed<Loadable<Product>>(() => {
    const fetched = this.fetched();
    const seed = this.transition.product();
    if (fetched.status !== 'ready' && seed?.slug === this.slug()) {
      return { status: 'ready', data: seed };
    }
    return fetched;
  });

  private readonly target = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });

  /** What is on screen. It follows the route, but only after the button transition has swapped the content. */
  protected readonly shown = linkedSignal<Product | null, Product | null>({
    source: this.target,
    computation: (target, previous) => previous?.value ?? target,
  });

  protected readonly pageState = computed<Loadable<Product>>(() => {
    const product = this.shown();
    return product ? { status: 'ready', data: product } : this.state();
  });

  // Choices that start over when another product is shown, but survive a refresh of the same one.
  protected readonly colorIndex = linkedSignal<Product | null, number>({
    source: this.shown,
    computation: (product, previous) => (previous && previous.source?.slug === product?.slug ? previous.value : 0),
  });
  protected readonly size = linkedSignal<Product | null, string | null>({
    source: this.shown,
    computation: (product, previous) =>
      previous && previous.source?.slug === product?.slug ? previous.value : firstAvailable(product),
  });
  /** The colour name in the heading; it changes mid-wipe, so it lags behind `colorIndex`. */
  protected readonly colorLabel = linkedSignal<Product | null, string | null>({
    source: this.shown,
    computation: (product, previous) =>
      previous && previous.source?.slug === product?.slug ? previous.value : (product?.colors[0]?.name ?? null),
  });

  protected readonly color = computed(() => this.shown()?.colors[this.colorIndex()]);
  /** Panel colour: it follows the chosen colour, and fades between colours. */
  protected readonly panel = computed(() => {
    const product = this.shown();
    return product ? tintFor(product, this.colorIndex()) : null;
  });
  protected readonly viewTransform = computed(() => VIEWS[this.view()].transform);
  protected readonly visibleViews = computed(() => (this.moreViews() ? VIEWS : VIEWS.slice(0, 3)));
  protected readonly stars = computed(() => {
    const rating = this.shown()?.rating ?? 0;
    return [1, 2, 3, 4, 5].map((point) => rating >= point - 0.25);
  });
  protected readonly sizeLabel = computed(() => {
    const sizes = this.shown()?.sizes ?? [];
    if (sizes.some((size) => /kg$/i.test(size))) return 'Weight';
    if (sizes.every((size) => /^L\d$/.test(size))) return 'Grip';
    return sizes.every((size) => /^\d+$/.test(size)) ? 'Size (EU)' : 'Size';
  });

  // Two stacked image layers: the incoming one is prepared behind, then the pair is animated.
  protected readonly layerSrc = linkedSignal<string, [string, string]>({
    source: () => this.shown()?.imageUrl ?? '',
    computation: (source, previous) => previous?.value ?? [source, ''],
  });
  protected readonly layerFilter = linkedSignal<ProductColor | undefined, [string, string]>({
    source: this.color,
    computation: (color, previous) => previous?.value ?? [hueFilter(color), 'none'],
  });
  protected readonly front = signal<0 | 1>(0);
  protected readonly frontFilter = computed(() => this.layerFilter()[this.front()]);
  protected readonly frontSrc = computed(() => this.layerSrc()[this.front()]);

  private readonly layers = viewChildren<ElementRef<HTMLElement>>('layer');
  private readonly titleWipe = viewChild<ElementRef<HTMLElement>>('titleWipe');
  private readonly priceWipe = viewChild<ElementRef<HTMLElement>>('priceWipe');
  private readonly eyebrowWipe = viewChild<ElementRef<HTMLElement>>('eyebrowWipe');
  private readonly addWipe = viewChild<ElementRef<HTMLElement>>('addWipe');

  // Neighbours in the same category, for the prev/next arrows.
  private readonly siblings = toSignal(
    toObservable(computed(() => this.shown()?.categorySlug ?? null)).pipe(
      distinctUntilChanged(),
      switchMap((category) =>
        category
          ? this.api.search({ category, pageSize: 24 }).pipe(
              map((page) => page.items),
              catchError(() => of([] as Product[])),
            )
          : of([] as Product[]),
      ),
    ),
    { initialValue: [] as Product[] },
  );
  protected readonly position = computed(() => this.siblings().findIndex((item) => item.slug === this.shown()?.slug));
  protected readonly dashes = computed(() => Array.from({ length: this.siblings().length }, (_, index) => index));

  private pendingDirection = 1;
  private addedTimer?: ReturnType<typeof setTimeout>;
  private showcaseTimer?: ReturnType<typeof setInterval>;

  constructor() {
    // Lets the list card for this product pick up the morph names when the user goes back.
    effect(() => this.transition.active.set(this.slug()));

    effect(() => this.transition.panelLight.set(this.panel()?.light ?? true));

    effect(() => {
      const target = this.target();
      untracked(() => this.follow(target));
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.addedTimer);
      clearInterval(this.showcaseTimer);
    });
  }

  /** Esc goes back and ←/→ step through products, but never while the user is typing (e.g. in the search box). */
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    if (event.key === 'Escape') {
      this.back();
    } else if (event.key === 'ArrowRight') {
      this.go(1);
    } else if (event.key === 'ArrowLeft') {
      this.go(-1);
    }
  }

  protected changeQuantity(delta: number, max: number): void {
    this.quantity.update((current) => Math.min(Math.max(1, current + delta), Math.min(max, 20)));
  }

  protected back(): void {
    // History back restores the list's scroll position, so the card is there for the reverse morph.
    if ((history.state?.navigationId ?? 0) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/catalog');
    }
  }

  protected retry(): void {
    this.reload.next();
  }

  protected selectSize(size: string): void {
    this.size.set(size);
  }

  protected setView(index: number): void {
    this.stopShowcase();
    this.view.set(index);
  }

  protected toggleWishlist(slug: string): void {
    this.wishlist.toggle(slug);
  }

  /** Previous/next product in the category (-1 / 1). */
  protected go(direction: number, fromShowcase = false): void {
    if (!fromShowcase) {
      this.stopShowcase();
    }
    const list = this.siblings();
    const index = this.position();
    if (this.busy() || list.length < 2 || index < 0) {
      return;
    }

    const next = list[(index + direction + list.length) % list.length];
    this.pendingDirection = direction;
    this.transition.open(next);
    // Replace, so the Back button still returns to the list instead of stepping through products.
    void this.router.navigate(['/products', next.slug], { replaceUrl: true });
  }

  /** Another colour of the same product: the picture lifts away and the new one settles in, the heading is wiped. */
  protected async pickColor(index: number, fromShowcase = false): Promise<void> {
    if (!fromShowcase) {
      this.stopShowcase();
    }
    const product = this.shown();
    const color = product?.colors[index];
    if (!product || !color || this.busy() || index === this.colorIndex()) {
      return;
    }

    this.busy.set(true);
    this.colorIndex.set(index);
    const eyebrow = this.eyebrowWipe()?.nativeElement;
    try {
      await Promise.all([
        this.swapHero(product.imageUrl, hueFilter(color), 'lift', 1),
        wipeSwap(eyebrow ? [eyebrow] : [], async () => {
          this.colorLabel.set(color.name);
          await this.rendered();
        }),
      ]);
    } finally {
      this.busy.set(false);
    }
  }

  protected toggleShowcase(): void {
    if (this.playing()) {
      this.stopShowcase();
      return;
    }
    this.playing.set(true);
    this.tick();
    this.showcaseTimer = setInterval(() => this.tick(), SHOWCASE_MS);
  }

  protected async flashAdded(): Promise<void> {
    clearTimeout(this.addedTimer);
    if (!this.added()) {
      await this.wipeLabel(true);
    }
    this.addedTimer = setTimeout(() => void this.wipeLabel(false), ADDED_MS);
  }

  /** The showcase walks through the colours, then moves on to the next product. */
  private tick(): void {
    const colors = this.shown()?.colors ?? [];
    if (this.colorIndex() < colors.length - 1) {
      void this.pickColor(this.colorIndex() + 1, true);
    } else {
      this.go(1, true);
    }
  }

  private stopShowcase(): void {
    clearInterval(this.showcaseTimer);
    this.showcaseTimer = undefined;
    this.playing.set(false);
  }

  private follow(target: Product | null): void {
    const current = this.shown();
    if (!target || !current) {
      return;
    }
    if (target.slug === current.slug) {
      // Same product, fresher data (e.g. the API answered after the seed): refresh quietly.
      if (!this.busy()) {
        this.shown.set(target);
      }
      return;
    }
    void this.swapProduct(target, this.pendingDirection);
    this.pendingDirection = 1;
  }

  /** Other product: image slides, title/price/eyebrow are wiped, the backdrop colour cross-fades. */
  private async swapProduct(next: Product, direction: number): Promise<void> {
    this.busy.set(true);
    if (this.view() >= 2) {
      this.view.set(0);
    }
    const blocks = [this.titleWipe(), this.priceWipe(), this.eyebrowWipe()].flatMap((ref) =>
      ref ? [ref.nativeElement] : [],
    );

    try {
      await Promise.all([
        this.swapHero(next.imageUrl, hueFilter(next.colors[0]), 'slide', direction),
        wipeSwap(blocks, async () => {
          this.shown.set(next);
          await this.rendered();
        }),
      ]);
    } finally {
      // Pick up anything newer the API returned while we were animating, and never leave the page locked.
      this.shown.set(this.target() ?? next);
      this.busy.set(false);
    }
  }

  private async swapHero(src: string, filter: string, kind: SwapKind, direction: number): Promise<void> {
    const out = this.front();
    const inn = (1 - out) as 0 | 1;

    this.layerSrc.update(([first, second]) => (inn === 0 ? [src, second] : [first, src]));
    this.layerFilter.update(([first, second]) => (inn === 0 ? [filter, second] : [first, filter]));
    await this.rendered();

    const elements = this.layers().map((ref) => ref.nativeElement);
    const picture = elements[inn].querySelector('img');
    await picture?.decode().catch(() => undefined);

    // Created before the layer flip renders, so the incoming image never flashes in at full opacity.
    const finished = swapLayers(elements[out], elements[inn], kind, direction);
    this.front.set(inn);
    await finished;
  }

  private async wipeLabel(added: boolean): Promise<void> {
    const block = this.addWipe()?.nativeElement;
    await wipeSwap(block ? [block] : [], async () => {
      this.added.set(added);
      await this.rendered();
    });
  }

  private rendered(): Promise<void> {
    return new Promise((resolve) => afterNextRender(() => resolve(), { injector: this.injector }));
  }
}
