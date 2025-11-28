import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

const API = environment.apiUrl + '/transactions';
const CAT_API = environment.apiUrl + '/categories';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private http: HttpClient) {}

  list(from?: string, to?: string, type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (type) params = params.set('type', type);
    return this.http.get<any[]>(API, { params });
  }

  create(payload: any) {
    return this.http.post(API, payload);
  }

  update(id: number, payload: any) {
    return this.http.put(`${API}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${API}/${id}`);
  }

  getCategories() {
    return this.http.get<any[]>(CAT_API);
  }
}
