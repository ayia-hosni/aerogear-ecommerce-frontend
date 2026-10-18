import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { CategoriesApi } from '../../core/api/categories.api';
import { ProductsApi } from '../../core/api/products.api';
import { PagedResult, Product, ProductSort } from '../../core/models/product.model';
import { LOADING, Loadable, toLoadable } from '../../core/utils/loadable';
import { AsyncState } from '../../shared/components/async-state';
import { ProductCard } from '../../shared/components/product-card';

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'Newest', label: 'Newest' },
  { value: 'TopRated', label: 'Top rated' },
  { value: 'PriceAscending', label: 'Price: low to high' },
  { value: 'PriceDescending', label: 'Price: high to low' },
];

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AsyncState, ProductCard],
  templateUrl: './catalog.page.html',
})
export class CatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsApi);
  private readonly reload = new BehaviorSubject<void>(undefined);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly categories = toSignal(inject(CategoriesApi).list().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  private readonly filters$ = this.route.queryParamMap.pipe(
    map((params) => ({
      category: params.get('category') ?? undefined,
      search: params.get('search') ?? undefined,
      sort: (params.get('sort') as ProductSort | null) ?? 'Newest',
      page: Math.max(1, Number(params.get('page')) || 1),
    })),
  );

  protected readonly filters = toSignal(this.filters$, { requireSync: true });

  protected readonly result = toSignal(
    combineLatest([this.filters$, this.reload]).pipe(
      switchMap(([filters]) => this.productsApi.search({ ...filters, pageSize: PAGE_SIZE }).pipe(toLoadable())),
    ),
    { initialValue: LOADING as Loadable<PagedResult<Product>> },
  );

  protected readonly totalCount = computed(() => {
    const state = this.result();
    return state.status === 'ready' ? state.data.totalCount : null;
  });

  protected readonly heading = computed(() => {
    const { category, search } = this.filters();
    if (search) {
      return `Results for “${search}”`;
    }
    return this.categories().find((item) => item.slug === category)?.name ?? 'All gear';
  });

  protected update(changes: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: null, ...changes },
      queryParamsHandling: 'merge',
    });
  }

  protected onSortChange(event: Event): void {
    this.update({ sort: (event.target as HTMLSelectElement).value });
  }

  protected retry(): void {
    this.reload.next();
  }

  protected pages(total: number): number[] {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
}
