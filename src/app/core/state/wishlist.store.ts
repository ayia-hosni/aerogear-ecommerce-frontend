import { Injectable, computed, effect, signal } from '@angular/core';
import { readJson, writeJson } from '../utils/storage';

const STORAGE_KEY = 'aerogear.wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly slugs = signal<string[]>(readJson<string[]>(STORAGE_KEY) ?? []);

  readonly count = computed(() => this.slugs().length);

  constructor() {
    effect(() => writeJson(STORAGE_KEY, this.slugs()));
  }

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(slug: string): void {
    this.slugs.update((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }
}
