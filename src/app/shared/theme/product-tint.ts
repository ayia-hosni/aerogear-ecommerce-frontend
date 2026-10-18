import { Product } from '../../core/models/product.model';
import { CARD_THEMES } from './product-theme';

export interface Tint {
  /** Panel colour. */
  background: string;
  /** Text colour that reads on it. */
  ink: string;
  /** Whether the ink is light (white), e.g. to colour the logo drawn over the panel. */
  light: boolean;
  /** Contrasting fill for buttons on the panel. */
  accent: string;
  accentInk: string;
}

const DARK = '#0f172a';
const LIGHT = '#ffffff';

function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function shade(hex: string, amount: number): string {
  const mixed = channels(hex).map((channel) => Math.max(0, Math.min(255, Math.round(channel * (1 + amount)))));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The panel colour for a product: the chosen colour when it has colours, otherwise its theme colour.
 * The ink flips to dark on light colours (lime, aqua) so text always stays readable.
 */
export function tintFor(product: Pick<Product, 'theme' | 'colors'>, colorIndex = 0): Tint {
  const chosen = product.colors[colorIndex]?.hex;
  const background = chosen ? shade(chosen, -0.12) : CARD_THEMES[product.theme].hex;
  const light = luminance(background) < 0.4;
  return {
    background,
    ink: light ? LIGHT : DARK,
    light,
    accent: light ? LIGHT : DARK,
    accentInk: light ? DARK : LIGHT,
  };
}
