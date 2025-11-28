import { Component, OnInit } from '@angular/core';
import { TransactionsService } from '../../services/transactions.service';
import { Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss'],
})
export class AddTransactionComponent implements OnInit {
  amount: number | null = null;
  type = 'expense';
  category_id: number | null = null;
  note = '';
  categories: any[] = [];

  constructor(private tx: TransactionsService, private router: Router) {}

  ngOnInit() {
    this.tx.getCategories().subscribe({
      next: (cats) => { this.categories = cats; },
      error: (err) => console.error(err)
    });
  }

  submit() {
    const payload = {
      amount: this.amount,
      type: this.type,
      category_id: this.category_id,
      note: this.note,
      occurred_at: new Date().toISOString()
    };
    this.tx.create(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error(err)
    });
  }
}
