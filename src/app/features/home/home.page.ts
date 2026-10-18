import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, map, of, switchMap } from 'rxjs';
import { CategoriesApi } from '../../core/api/categories.api';
import { ProductsApi } from '../../core/api/products.api';
import { LOADING, Loadable, toLoadable } from '../../core/utils/loadable';
import { Product } from '../../core/models/product.model';
import { AsyncState } from '../../shared/components/async-state';
import { ProductCarousel } from '../../shared/components/product-carousel';
import { ProductStack } from './product-stack';

interface SportPromo {
  slug: string;
  eyebrow: string;
  title: string;
  image: string;
}

const SPORT_PROMOS: SportPromo[] = [
  {
    slug: 'training',
    eyebrow: 'Strength & Conditioning',
    title: 'Gym Training',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
  },
  {
    slug: 'running',
    eyebrow: 'Endurance & Speed',
    title: 'Running Track',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800',
  },
  {
    slug: 'basketball',
    eyebrow: 'Court & Hardwood',
    title: 'Basketball',
    image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&q=80&w=800',
  },
];

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, AsyncState, ProductCarousel, ProductStack],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly products = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);

  private readonly reload = new BehaviorSubject<void>(undefined);

  protected readonly promos = SPORT_PROMOS;
  protected readonly categories = toSignal(this.categoriesApi.list().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  protected readonly featured = toSignal(
    this.reload.pipe(
      switchMap(() => this.products.search({ featured: true, pageSize: 12 }).pipe(map((page) => page.items), toLoadable())),
    ),
    { initialValue: LOADING as Loadable<Product[]> },
  );

  protected readonly trending = toSignal(
    this.reload.pipe(
      switchMap(() =>
        this.products.search({ featured: false, sort: 'TopRated', pageSize: 12 }).pipe(map((page) => page.items), toLoadable()),
      ),
    ),
    { initialValue: LOADING as Loadable<Product[]> },
  );

  protected retry(): void {
    this.reload.next();
  }
}
