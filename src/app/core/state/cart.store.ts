import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { readJson, writeJson } from '../utils/storage';

const STORAGE_KEY = 'aerogear.cart';
const MAX_PER_LINE = 20;

export interface CartOptions {
  size?: string | null;
  color?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly state = signal<CartItem[]>(readJson<CartItem[]>(STORAGE_KEY) ?? []);

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((total, item) => total + item.quantity, 0));
  readonly subtotal = computed(() =>
    this.state().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );
  readonly isEmpty = computed(() => this.state().length === 0);

  constructor() {
    effect(() => writeJson(STORAGE_KEY, this.state()));
  }

  add(product: Product, quantity = 1, options: CartOptions = {}): void {
    const limit = Math.min(product.stock, MAX_PER_LINE);

    this.state.update((items) => {
      const existing = items.find((item) => item.productId === product.id);
      if (!existing) {
        return [
          ...items,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.imageUrl,
            unitPrice: product.price,
            quantity: Math.min(quantity, limit),
            maxQuantity: limit,
            ...this.chosen(options),
          },
        ];
      }
      return items.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              unitPrice: product.price,
              maxQuantity: limit,
              quantity: Math.min(item.quantity + quantity, limit),
              ...this.chosen(options),
            }
          : item,
      );
    });
  }

  private chosen(options: CartOptions): Pick<CartItem, 'size' | 'color'> {
    return { size: options.size ?? undefined, color: options.color ?? undefined };
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    this.state.update((items) =>
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(quantity, item.maxQuantity) } : item,
      ),
    );
  }

  remove(productId: string): void {
    this.state.update((items) => items.filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.state.set([]);
  }
}
