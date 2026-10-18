export type ProductTheme = 'Blue' | 'Dark' | 'Green' | 'Amber' | 'Purple' | 'Slate';

export type ProductSort = 'Newest' | 'PriceAscending' | 'PriceDescending' | 'TopRated';

export interface ProductColor {
  name: string;
  hex: string;
  /** The catalogue has one photo per product, so a colour is that photo with its hue rotated by this many degrees. */
  hueShift: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  series: string | null;
  summary: string;
  badge: string | null;
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  gallery: string[];
  tags: string[];
  sizes: string[];
  soldOutSizes: string[];
  colors: ProductColor[];
  theme: ProductTheme;
  isFeatured: boolean;
  categorySlug: string;
  categoryName: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
