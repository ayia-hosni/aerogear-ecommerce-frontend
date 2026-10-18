import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-async-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('loading') {
        <div class="flex items-center justify-center gap-3 py-24 text-gray-500" role="status">
          <i class="fa-solid fa-circle-notch fa-spin text-app-primary text-xl"></i>
          <span class="font-semibold">{{ loadingLabel() }}</span>
        </div>
      }
      @case ('error') {
        <div class="mx-auto max-w-md py-20 text-center" role="alert">
          <i class="fa-solid fa-triangle-exclamation mb-4 text-3xl text-red-500"></i>
          <p class="mb-5 font-semibold text-gray-700">{{ message() }}</p>
          <button
            type="button"
            class="rounded-full bg-app-dark px-6 py-3 text-sm font-bold tracking-wide text-white uppercase"
            (click)="retry.emit()"
          >
            Try again
          </button>
        </div>
      }
    }
  `,
})
export class AsyncState {
  readonly status = input.required<'loading' | 'error' | 'ready'>();
  readonly message = input('Something went wrong.');
  readonly loadingLabel = input('Loading…');
  readonly retry = output<void>();
}
