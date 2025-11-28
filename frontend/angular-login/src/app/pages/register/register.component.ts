import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  email = '';
  password = '';
  error = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.message = '';
    this.auth.register(this.email, this.password).subscribe({
      next: (res) => {
        this.message = res.message || 'Registered';
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        this.error = err.error?.message || 'Register failed';
      }
    });
  }
}
