import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const BALL_SIZE = 30;
const FLIGHT_MS = 800;
const IMPACT_MS = 300;

@Injectable({ providedIn: 'root' })
export class CartFlightService {
  private readonly document = inject(DOCUMENT);
  private target: HTMLElement | null = null;

  readonly impact = signal(false);

  registerTarget(element: HTMLElement | null): void {
    this.target = element;
  }

  launch(origin: HTMLElement): void {
    const view = this.document.defaultView;
    if (!this.target || !view || view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const from = origin.getBoundingClientRect();
    const to = this.target.getBoundingClientRect();
    const startX = from.left + from.width / 2 - BALL_SIZE / 2;
    const startY = from.top + from.height / 2 - BALL_SIZE / 2;
    const deltaX = to.left + to.width / 2 - from.left - from.width / 2;
    const deltaY = to.top + to.height / 2 - from.top - from.height / 2;

    const horizontal = this.document.createElement('div');
    Object.assign(horizontal.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      zIndex: '10000',
      pointerEvents: 'none',
    });

    const vertical = this.document.createElement('div');
    const ball = this.document.createElement('div');
    ball.textContent = '🏀';
    Object.assign(ball.style, { fontSize: `${BALL_SIZE}px`, lineHeight: '1' });

    vertical.appendChild(ball);
    horizontal.appendChild(vertical);
    this.document.body.appendChild(horizontal);

    const options = { duration: FLIGHT_MS, fill: 'forwards' as const };
    const finished = horizontal.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${deltaX}px)` }],
      { ...options, easing: 'linear' },
    ).finished;
    vertical.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${deltaY}px)` }],
      { ...options, easing: 'cubic-bezier(0.3, -0.8, 0.6, 1)' },
    );
    ball.animate(
      [
        { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'rotate(360deg) scale(0.3)', opacity: 0 },
      ],
      { ...options, easing: 'linear' },
    );

    void finished.then(() => {
      horizontal.remove();
      this.impact.set(true);
      view.setTimeout(() => this.impact.set(false), IMPACT_MS);
    });
  }
}
