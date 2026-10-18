import { ProductTheme } from '../../core/models/product.model';

export interface CardTheme {
  hex: string;
  surface: string;
  series: string;
  title: string;
  price: string;
  badge: string;
  tag: string;
  cta: string;
  ctaIcon: string;
  addBg: string;
  addText: string;
  chip: string;
  next: string;
  thumbBorder: string;
  thumbActive: string;
  dropShadow: string;
}

const onDark = {
  title: 'text-white',
  price: 'text-white',
  tag: 'border-white/30 text-white hover:bg-white/10',
  chip: 'bg-white/20 text-white border-white/20',
  next: 'bg-black/30 text-white border-white/20 hover:bg-black/50',
  thumbBorder: 'border-white/20 hover:border-white',
  thumbActive: 'border-white/40',
  dropShadow: 'drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)]',
};

const onLight = {
  title: 'text-app-dark',
  price: 'text-app-dark',
  tag: 'border-app-dark/30 text-app-dark hover:bg-app-dark/10',
  chip: 'bg-black/15 text-white border-white/20',
  next: 'bg-black/20 text-app-dark border-black/10 hover:bg-black/30',
  thumbBorder: 'border-app-dark/10 hover:border-app-dark',
  thumbActive: 'border-app-dark/30',
  dropShadow: 'drop-shadow-[0_40px_30px_rgba(0,0,0,0.4)]',
};

export const CARD_THEMES: Record<ProductTheme, CardTheme> = {
  Blue: {
    hex: '#2563eb',
    ...onDark,
    surface: 'bg-[#2563eb]',
    series: 'text-blue-200',
    badge: 'text-app-primary',
    cta: 'bg-white text-app-primary border-white hover:bg-gray-100',
    ctaIcon: 'bg-app-primary text-white',
    addBg: 'bg-white',
    addText: 'text-app-primary',
  },
  Dark: {
    hex: '#111827',
    ...onDark,
    surface: 'bg-[#111827]',
    series: 'text-red-500',
    badge: 'text-red-500',
    tag: 'border-gray-600 text-white hover:bg-white/10',
    chip: 'bg-white/10 text-white border-white/20',
    next: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
    cta: 'bg-red-600 text-white border-red-500/30 hover:bg-red-500',
    ctaIcon: 'bg-white text-red-600',
    addBg: 'bg-red-600',
    addText: 'text-white',
  },
  Green: {
    hex: '#059669',
    ...onLight,
    surface: 'bg-[#059669]',
    series: 'text-green-200',
    badge: 'text-app-dark',
    chip: 'bg-white/20 text-white border-white/20',
    cta: 'bg-app-dark text-white border-black/20 hover:bg-gray-900',
    ctaIcon: 'bg-app-primary text-white',
    addBg: 'bg-app-dark',
    addText: 'text-white',
  },
  Amber: {
    hex: '#f59e0b',
    ...onLight,
    surface: 'bg-amber-500',
    series: 'text-orange-900',
    badge: 'text-app-dark',
    cta: 'bg-app-dark text-white border-black/20 hover:bg-gray-900',
    ctaIcon: 'bg-amber-500 text-app-dark',
    addBg: 'bg-app-dark',
    addText: 'text-white',
  },
  Purple: {
    hex: '#9333ea',
    ...onDark,
    surface: 'bg-purple-600',
    series: 'text-purple-200',
    badge: 'text-purple-600',
    cta: 'bg-white text-purple-700 border-white hover:bg-gray-100',
    ctaIcon: 'bg-purple-700 text-white',
    addBg: 'bg-white',
    addText: 'text-purple-700',
  },
  Slate: {
    hex: '#1e293b',
    ...onDark,
    surface: 'bg-slate-800',
    series: 'text-slate-400',
    badge: 'text-slate-800',
    tag: 'border-slate-600 text-white hover:bg-white/10',
    chip: 'bg-white/10 text-white border-white/20',
    next: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
    cta: 'bg-slate-200 text-slate-900 border-white hover:bg-white',
    ctaIcon: 'bg-slate-900 text-white',
    addBg: 'bg-slate-200',
    addText: 'text-slate-900',
  },
};
