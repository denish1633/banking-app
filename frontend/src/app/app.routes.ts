// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransferComponent } from './pages/transfer/transfer.component';
import { AddTransactionComponent } from './pages/add-transaction/add-transaction.component';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-transaction', component: AddTransactionComponent },
  { path: 'transfer', component:  TransferComponent},
  { path: '**', redirectTo: 'login' } // fallback
];
