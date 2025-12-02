import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss'],
})
export class AddTransactionComponent implements OnInit {
  txForm!: FormGroup;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private txService: TransactionService,
    private catService: CategoryService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.txForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      type: ['expense', Validators.required],
      category_id: [null],
      note: [''],
      occurred_at: [new Date().toISOString().split('T')[0], Validators.required], // bind as yyyy-MM-dd
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.catService.getCategories().subscribe({
      next: (res) => (this.categories = res),
      error: (err) => console.error(err),
    });
  }

  submit(): void {
    if (this.txForm.invalid) return;
    console.log("Adding transaction:");
    console.log(this.txForm.value);

    this.txService.addTransaction(this.txForm.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error(err),
    });
  }
}
