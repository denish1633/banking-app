import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categoryForm!: FormGroup;
  categories: any[] = [];
  editId: number | null = null;
  displayedColumns = ['name', 'type', 'actions'];

  constructor(private fb: FormBuilder, private catService: CategoryService) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      type: ['expense', Validators.required],
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
    if (this.categoryForm.invalid) return;
    const payload = this.categoryForm.value;

    if (this.editId) {
      this.catService.updateCategory(this.editId, payload).subscribe({
        next: () => {
          this.loadCategories();
          this.categoryForm.reset({ name: '', type: 'expense' });
          this.editId = null;
        },
        error: (err) => console.error(err),
      });
    } else {
      this.catService.addCategory(payload).subscribe({
        next: () => {
          this.loadCategories();
          this.categoryForm.reset({ name: '', type: 'expense' });
        },
        error: (err) => console.error(err),
      });
    }
  }

  editCategory(cat: any): void {
    this.editId = cat.id;
    this.categoryForm.setValue({ name: cat.name, type: cat.type });
  }

  deleteCategory(id: number): void {
    this.catService.deleteCategory(id).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error(err),
    });
  }
}
