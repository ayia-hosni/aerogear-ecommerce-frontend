import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api-url';
import { Category } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL)}/categories`;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }
}
