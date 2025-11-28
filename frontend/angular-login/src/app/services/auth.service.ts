import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

const API = environment.apiUrl + '/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${API}/register`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${API}/login`, { email, password });
  }
}
