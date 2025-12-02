// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:5050/api/auth';

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.token) this.tokenService.setToken(res.token);
      })
    );
  }

  logout(): void {
    this.tokenService.removeToken();
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }
}
