import {  OnInit } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { Component } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: any;
  totals: any = { income: 0, expense: 0 };
  transactions: any[] = [];

  constructor(
    private token: TokenService,
    private router: Router,
    private txService: TransactionsService
  ) { this.user = this.token.getUser(); }

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.txService.list().subscribe({
      next: (rows) => this.transactions = rows,
      error: (err) => console.error(err)
    });
  }

  logout() {
    this.token.signOut();
    this.router.navigate(['/login']);
  }
}
