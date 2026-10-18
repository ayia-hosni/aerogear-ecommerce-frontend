import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header],
  template: `
    <app-header />
    <main class="mx-auto max-w-7xl px-6 py-6 md:px-10">
      <router-outlet />
    </main>
    <footer class="mx-auto mt-16 max-w-7xl px-6 pb-10 text-sm font-medium text-gray-400 md:px-10">
      © {{ year }} AeroGear. All rights reserved.
    </footer>
  `,
})
export class App {
  protected readonly year = new Date().getFullYear();
}
