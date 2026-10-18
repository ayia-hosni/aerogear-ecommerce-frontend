import { Observable, OperatorFunction, catchError, map, of, startWith } from 'rxjs';
import { describeHttpError } from './http-error';

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

export const LOADING: Loadable<never> = { status: 'loading' };

export function toLoadable<T>(): OperatorFunction<T, Loadable<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      map((data): Loadable<T> => ({ status: 'ready', data })),
      catchError((error) => of<Loadable<T>>({ status: 'error', message: describeHttpError(error) })),
      startWith<Loadable<T>>(LOADING),
    );
}
