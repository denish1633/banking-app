import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];
  displayedColumns = ['id', 'amount', 'type', 'note', 'occurred_at', 'category', 'actions'];

  constructor(private txService: TransactionService, public router: Router) {}

  ngOnInit() {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.txService.getTransactions().subscribe({
      next: data => this.transactions = data,
      error: err => console.error(err)
    });
  }

  deleteTransaction(id: number) {
    if (!confirm('Delete this transaction?')) return;
    this.txService.deleteTransaction(id).subscribe({
      next: () => this.transactions = this.transactions.filter(tx => tx.id !== id),
      error: err => console.error(err)
    });
  }

  editTransaction(id: number) {
    this.router.navigate(['/add-transaction'], { queryParams: { id } });
  }
}




