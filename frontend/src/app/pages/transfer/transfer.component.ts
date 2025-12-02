// transfer.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

interface Account {
  id: number;
  account_number: string;
  balance: number;
  type: string;
  currency: string;
}

interface Beneficiary {
  id: number;
  name: string;
  account_number: string;
  bank_name: string;
  nickname?: string;
}

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatStepperModule,
    MatRadioModule,
    MatDialogModule
  ],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {
  transferForm: FormGroup;
  confirmationForm: FormGroup;
  
  // Data
  accounts: Account[] = [];
  beneficiaries: Beneficiary[] = [];
  recentRecipients: Beneficiary[] = [];
  
  // UI State
  isLoading: boolean = false;
  selectedAccount: Account | null = null;
  selectedBeneficiary: Beneficiary | null = null;
  transferType: 'own' | 'saved' | 'new' = 'saved';
  currentStep: number = 0;
  
  // Transfer summary
  transferFee: number = 0;
  totalAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.transferForm = this.fb.group({
      fromAccount: ['', Validators.required],
      transferType: ['saved', Validators.required],
      beneficiaryId: [''],
      recipientName: ['', Validators.required],
      recipientAccount: ['', [Validators.required, Validators.pattern(/^\d{10,16}$/)]],
      recipientBank: [''],
      amount: ['', [Validators.required, Validators.min(1)]],
      description: [''],
      reference: ['']
    });

    this.confirmationForm = this.fb.group({
      pin: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadBeneficiaries();
    this.loadRecentRecipients();
    this.setupFormListeners();
  }

  loadAccounts(): void {
    // TODO: Replace with actual API call
    this.accounts = [
      {
        id: 1,
        account_number: '1234567890',
        balance: 15595.015,
        type: 'Checking',
        currency: 'USD'
      },
      {
        id: 2,
        account_number: '0987654321',
        balance: 25000.00,
        type: 'Savings',
        currency: 'USD'
      }
    ];
  }

  loadBeneficiaries(): void {
    // TODO: Replace with actual API call
    this.beneficiaries = [
      {
        id: 1,
        name: 'John Doe',
        account_number: '1111222233',
        bank_name: 'Chase Bank',
        nickname: 'John'
      },
      {
        id: 2,
        name: 'Jane Smith',
        account_number: '4444555566',
        bank_name: 'Bank of America',
        nickname: 'Jane'
      }
    ];
  }

  loadRecentRecipients(): void {
    // TODO: Replace with actual API call
    this.recentRecipients = this.beneficiaries.slice(0, 3);
  }

  setupFormListeners(): void {
    // Listen to account selection
    this.transferForm.get('fromAccount')?.valueChanges.subscribe(accountId => {
      this.selectedAccount = this.accounts.find(acc => acc.id === accountId) || null;
    });

    // Listen to transfer type changes
    this.transferForm.get('transferType')?.valueChanges.subscribe(type => {
      this.transferType = type;
      this.updateFormValidation();
    });

    // Listen to beneficiary selection
    this.transferForm.get('beneficiaryId')?.valueChanges.subscribe(beneficiaryId => {
      const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
      if (beneficiary) {
        this.selectedBeneficiary = beneficiary;
        this.transferForm.patchValue({
          recipientName: beneficiary.name,
          recipientAccount: beneficiary.account_number,
          recipientBank: beneficiary.bank_name
        });
      }
    });

    // Listen to amount changes
    this.transferForm.get('amount')?.valueChanges.subscribe(amount => {
      this.calculateFees(amount);
    });
  }

  updateFormValidation(): void {
    const recipientNameControl = this.transferForm.get('recipientName');
    const recipientAccountControl = this.transferForm.get('recipientAccount');
    const recipientBankControl = this.transferForm.get('recipientBank');
    const beneficiaryIdControl = this.transferForm.get('beneficiaryId');

    if (this.transferType === 'saved') {
      beneficiaryIdControl?.setValidators([Validators.required]);
      recipientNameControl?.clearValidators();
      recipientAccountControl?.clearValidators();
      recipientBankControl?.clearValidators();
    } else if (this.transferType === 'new') {
      beneficiaryIdControl?.clearValidators();
      recipientNameControl?.setValidators([Validators.required]);
      recipientAccountControl?.setValidators([Validators.required, Validators.pattern(/^\d{10,16}$/)]);
      recipientBankControl?.setValidators([Validators.required]);
    } else {
      // own account transfer
      beneficiaryIdControl?.clearValidators();
      recipientNameControl?.clearValidators();
      recipientAccountControl?.clearValidators();
      recipientBankControl?.clearValidators();
    }

    beneficiaryIdControl?.updateValueAndValidity();
    recipientNameControl?.updateValueAndValidity();
    recipientAccountControl?.updateValueAndValidity();
    recipientBankControl?.updateValueAndValidity();
  }

  calculateFees(amount: number): void {
    // Simple fee calculation - adjust based on your business logic
    if (amount > 0 && amount <= 1000) {
      this.transferFee = 0; // Free for small transfers
    } else if (amount > 1000 && amount <= 10000) {
      this.transferFee = 2.50;
    } else {
      this.transferFee = 5.00;
    }
    
    this.totalAmount = amount + this.transferFee;
  }

  selectRecipient(beneficiary: Beneficiary): void {
    this.transferForm.patchValue({
      beneficiaryId: beneficiary.id,
      transferType: 'saved'
    });
  }

  nextStep(): void {
    if (this.currentStep === 0 && this.transferForm.valid) {
      this.currentStep = 1;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.confirmationForm.valid && this.transferForm.valid) {
      this.isLoading = true;

      const transferData = {
        ...this.transferForm.value,
        pin: this.confirmationForm.value.pin,
        fee: this.transferFee,
        totalAmount: this.totalAmount,
        timestamp: new Date().toISOString()
      };

      // TODO: Replace with actual API call
      console.log('Transfer Data:', transferData);

      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate to success page
        this.router.navigate(['/transfer/success'], {
          queryParams: {
            amount: this.transferForm.value.amount,
            recipient: this.transferForm.value.recipientName,
            reference: this.transferForm.value.reference
          }
        });
      }, 2000);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}