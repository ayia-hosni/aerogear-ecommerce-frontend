import { TestBed } from '@angular/core/testing';
import { Product } from '../models/product.model';
import { CartStore } from './cart.store';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Trail Shoe',
  slug: 'trail-shoe',
  series: null,
  summary: 'Grippy',
  badge: null,
  price: 100,
  stock: 5,
  rating: 4.5,
  reviewCount: 10,
  imageUrl: 'https://example.com/shoe.png',
  gallery: [],
  tags: [],
  sizes: [],
  soldOutSizes: [],
  colors: [],
  theme: 'Blue',
  isFeatured: false,
  categorySlug: 'running',
  categoryName: 'Running',
  ...overrides,
});

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
  });

  it('keeps the size and colour chosen on the product page', () => {
    store.add(product(), 1, { size: '42', color: 'Volt' });
    store.add(product(), 1, { size: '43', color: 'Ember' });

    expect(store.items()).toHaveLength(1);
    expect(store.items()[0]).toMatchObject({ quantity: 2, size: '43', color: 'Ember' });
  });

  it('merges repeated additions into a single line', () => {
    store.add(product());
    store.add(product(), 2);

    expect(store.items()).toHaveLength(1);
    expect(store.count()).toBe(3);
    expect(store.subtotal()).toBe(300);
  });

  it('never exceeds available stock', () => {
    store.add(product({ stock: 2 }), 5);

    expect(store.count()).toBe(2);
  });

  it('removes a line when quantity drops below one', () => {
    store.add(product());
    store.setQuantity('p1', 0);

    expect(store.isEmpty()).toBe(true);
  });

  it('clears all items', () => {
    store.add(product());
    store.add(product({ id: 'p2', slug: 'other' }));
    store.clear();

    expect(store.count()).toBe(0);
  });
});
