// transfer-success.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface TransferDetails {
  transactionId: string;
  amount: number;
  recipient: string;
  recipientAccount: string;
  reference: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-transfer-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './transfer-success.component.html',
  styleUrls: ['./transfer-success.component.scss']
})
export class TransferSuccessComponent implements OnInit {
  transferDetails: TransferDetails | null = null;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get transfer details from query params or state
    this.route.queryParams.subscribe(params => {
      this.transferDetails = {
        transactionId: this.generateTransactionId(),
        amount: parseFloat(params['amount']) || 0,
        recipient: params['recipient'] || 'Unknown',
        recipientAccount: params['recipientAccount'] || 'N/A',
        reference: params['reference'] || 'N/A',
        date: new Date(),
        status: 'Successful'
      };
      this.isLoading = false;
    });
  }

  generateTransactionId(): string {
    // Generate a random transaction ID
    const prefix = 'TXN';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}${timestamp}${random}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  downloadReceipt(): void {
    // TODO: Implement PDF download
    console.log('Downloading receipt...');
    alert('Receipt download feature coming soon!');
  }

  shareReceipt(): void {
    // TODO: Implement share functionality
    console.log('Sharing receipt...');
    alert('Share feature coming soon!');
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  makeAnotherTransfer(): void {
    this.router.navigate(['/transfer']);
  }

  viewTransactions(): void {
    this.router.navigate(['/transactions']);
  }
}