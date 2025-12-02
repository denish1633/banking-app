// src/app/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private API = 'http://localhost:5050/api/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.API);
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.API, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.API}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
