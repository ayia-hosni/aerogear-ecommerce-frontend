/**
 * Button transitions, ported from the "loom" sneaker page: a solid block wipes across text while it changes,
 * and the product image swaps with a lift (same product, other view) or a slide (other product).
 * Plain Web Animations, so they work on any element.
 */
const EASE = 'cubic-bezier(.7,0,.3,1)';

const prefersReducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Covers each block from the left, runs `change` while the text is hidden, then uncovers to the right.
 * Blocks should be absolutely positioned over their text and filled with `currentColor`.
 */
export async function wipeSwap(blocks: HTMLElement[], change: () => void | Promise<void>): Promise<void> {
  if (prefersReducedMotion() || blocks.length === 0) {
    await change();
    return;
  }

  await Promise.all(
    blocks.map(
      (block) =>
        block.animate(
          [
            { transform: 'scaleX(0)', transformOrigin: 'left' },
            { transform: 'scaleX(1)', transformOrigin: 'left' },
          ],
          { duration: 260, easing: EASE, fill: 'forwards' },
        ).finished,
    ),
  );

  await change();

  await Promise.all(
    blocks.map(
      (block) =>
        block.animate(
          [
            { transform: 'scaleX(1)', transformOrigin: 'right' },
            { transform: 'scaleX(0)', transformOrigin: 'right' },
          ],
          { duration: 300, easing: EASE, fill: 'forwards' },
        ).finished,
    ),
  );
}

export type SwapKind = 'lift' | 'slide';

/**
 * Crossfades `out` into `inn`: 'lift' for another view of the same product, 'slide' for another product
 * (`direction` is 1 for next, -1 for previous). The animations are created synchronously.
 */
export function swapLayers(
  out: HTMLElement,
  inn: HTMLElement,
  kind: SwapKind,
  direction = 1,
): Promise<unknown> {
  if (prefersReducedMotion()) {
    return Promise.all([
      out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished,
      inn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'forwards' }).finished,
    ]);
  }

  if (kind === 'lift') {
    const leaving = out.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(-7%) rotate(-5deg) scale(1.02)', opacity: 0 },
      ],
      { duration: 320, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' },
    );
    const arriving = inn.animate(
      [
        { transform: 'translateY(-9%) rotate(-6deg) scale(1.03)', opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.45 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 640, delay: 140, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'both' },
    );
    return Promise.all([leaving.finished, arriving.finished]);
  }

  const leaving = out.animate(
    [
      { transform: 'none', opacity: 1 },
      { transform: `translateX(${-direction * 22}%) rotate(${-direction * 4}deg)`, opacity: 0 },
    ],
    { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' },
  );
  const arriving = inn.animate(
    [
      { transform: `translateX(${direction * 22}%) rotate(${direction * 4}deg)`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 700, delay: 200, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' },
  );
  return Promise.all([leaving.finished, arriving.finished]);
}
