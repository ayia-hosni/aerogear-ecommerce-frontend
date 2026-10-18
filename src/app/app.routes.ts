import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'AeroGear | Sports Gear',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'catalog',
    title: 'Catalog | AeroGear',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./features/product/product-detail.page').then((m) => m.ProductDetailPage),
  },
  {
    path: 'cart',
    title: 'Your bag | AeroGear',
    loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    title: 'Checkout | AeroGear',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'orders',
    title: 'My orders | AeroGear',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage),
  },
  {
    path: 'orders/:id',
    title: 'Order details | AeroGear',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/order-detail.page').then((m) => m.OrderDetailPage),
  },
  {
    path: 'login',
    title: 'Sign in | AeroGear',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account | AeroGear',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  { path: '**', redirectTo: '' },
];
