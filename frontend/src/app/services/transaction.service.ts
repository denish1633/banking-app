// src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  category_id?: number | null;
  note?: string;
  occurred_at: string | Date;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private API = 'http://localhost:5050/api/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.API);
  }

  addTransaction(tx: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.API, tx);
  }

  updateTransaction(id: number, tx: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.API}/${id}`, tx);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}


