import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { API_URL } from '../config/api-url';
import { PagedResult, Product, ProductFilters } from '../models/product.model';

const CACHE_MS = 60_000;

/** Options are optional on the wire (older rows and older API builds omit them), but always arrays in the app. */
const withOptions = (product: Product): Product => ({
  ...product,
  sizes: product.sizes ?? [],
  soldOutSizes: product.soldOutSizes ?? [],
  colors: product.colors ?? [],
});

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL)}/products`;
  /** Short-lived list cache so going back to a page repaints at once, which the card morph relies on. */
  private readonly cache = new Map<string, { at: number; request: Observable<PagedResult<Product>> }>();

  search(filters: ProductFilters = {}): Observable<PagedResult<Product>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    const key = params.toString();
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      return hit.request;
    }

    const request = this.http.get<PagedResult<Product>>(this.baseUrl, { params }).pipe(
      map((page) => ({ ...page, items: page.items.map(withOptions) })),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(key, { at: Date.now(), request });
    return request;
  }

  getBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${encodeURIComponent(slug)}`).pipe(map(withOptions));
  }
}
