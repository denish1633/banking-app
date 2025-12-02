// dashboard.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TransactionService } from '../../services/transaction.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category?: { name: string; icon?: string };
  note?: string;
  occurred_at: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('analyticsChart') analyticsChart!: ElementRef;
  
  // Data
  transactions: Transaction[] = [];
  totalIncome: number = 0;
  totalOutcome: number = 0;
  cardBalance: number = 0;
  currentBalance: number = 0;
  
  // Chart data
  incomeData: number[] = [];
  outcomeData: number[] = [];
  chartLabels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthlyData: MonthlyData[] = [];
  
  selectedYear: string = new Date().getFullYear().toString();
  selectedMonth: string = 'Month';
  dateRange: string = '10 May - 20 May';
  
  // Activity data - calculated from transactions
  dailyPaymentPercentage: number = 0;
  hobbyPercentage: number = 0;
  activityPercentage: number = 0;
  
  // Percentage changes
  incomeChange: number = 0;
  outcomeChange: number = 0;
  
  // UI state
  isLoading: boolean = false;
  errorMsg: string = '';
  showIncomeChart: boolean = true;
  showOutcomeChart: boolean = true;
  mobileMenuOpen: boolean = false;
  
  chart: any;

  constructor(
    private txService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Chart will be initialized after data is loaded
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMsg = '';

    this.txService.getTransactions().subscribe({
      next: (res: any[]) => {
        this.transactions = res.map(tx => ({
          ...tx,
          amount: Number(tx.amount) || 0
        }));
        
        this.calculateSummary();
        this.calculateMonthlyData();
        this.calculateActivityData();
        this.calculatePercentageChanges();
        
        // Initialize chart after data is ready
        setTimeout(() => {
          if (this.analyticsChart) {
            this.initChart();
          }
        }, 100);
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading transactions:', err);
        this.errorMsg = 'Failed to load dashboard data';
        this.isLoading = false;
      }
    });
  }

  calculateSummary(): void {
    const currentYear = parseInt(this.selectedYear);
    
    // Filter transactions for current year
    const yearTransactions = this.transactions.filter(tx => {
      const txDate = new Date(tx.occurred_at);
      return txDate.getFullYear() === currentYear;
    });

    this.totalIncome = yearTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    this.totalOutcome = yearTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    this.cardBalance = this.totalIncome - this.totalOutcome;
    this.currentBalance = this.cardBalance;
  }

  calculateMonthlyData(): void {
    const currentYear = parseInt(this.selectedYear);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    this.monthlyData = [];
    this.incomeData = [];
    this.outcomeData = [];

    for (let i = 0; i < 12; i++) {
      const monthTransactions = this.transactions.filter(tx => {
        const txDate = new Date(tx.occurred_at);
        return txDate.getFullYear() === currentYear && txDate.getMonth() === i;
      });

      const monthIncome = monthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthExpense = monthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      this.incomeData.push(monthIncome);
      this.outcomeData.push(monthExpense);
    }
  }

  calculateActivityData(): void {
    // Calculate category-based activity percentages
    const categoryTotals: { [key: string]: number } = {};
    const totalAmount = this.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    this.transactions.forEach(tx => {
      const categoryName = tx.category?.name || 'Other';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(tx.amount);
    });

    // Assume 'Daily payment' and 'Hobby' are category names or similar
    const dailyPaymentAmount = categoryTotals['Daily payment'] || categoryTotals['Shopping'] || 0;
    const hobbyAmount = categoryTotals['Hobby'] || categoryTotals['Entertainment'] || 0;

    if (totalAmount > 0) {
      this.dailyPaymentPercentage = Math.round((dailyPaymentAmount / totalAmount) * 100);
      this.hobbyPercentage = Math.round((hobbyAmount / totalAmount) * 100);
      this.activityPercentage = this.dailyPaymentPercentage + this.hobbyPercentage;
    }
  }

  calculatePercentageChanges(): void {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth - 1 >= 0 ? currentMonth - 1 : 11;

    const currentMonthIncome = this.incomeData[currentMonth] || 0;
    const lastMonthIncome = this.incomeData[lastMonth] || 0;
    
    const currentMonthOutcome = this.outcomeData[currentMonth] || 0;
    const lastMonthOutcome = this.outcomeData[lastMonth] || 0;

    if (lastMonthIncome > 0) {
      this.incomeChange = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    }

    if (lastMonthOutcome > 0) {
      this.outcomeChange = ((currentMonthOutcome - lastMonthOutcome) / lastMonthOutcome) * 100;
    }
  }

  initChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.analyticsChart.nativeElement.getContext('2d');
    
    const datasets = [];
    
    if (this.showIncomeChart) {
      datasets.push({
        label: 'Income',
        data: this.incomeData,
        backgroundColor: '#22d3ee',
        borderRadius: 8,
        barThickness: 20
      });
    }
    
    if (this.showOutcomeChart) {
      datasets.push({
        label: 'Outcome',
        data: this.outcomeData,
        backgroundColor: '#6366f1',
        borderRadius: 8,
        barThickness: 20
      });
    }
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (context: any) => {
                return context.dataset.label + ': ' + this.formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b'
            },
            border: {
              display: false
            }
          },
          y: {
            grid: {
              color: '#1e293b'
            },
            ticks: {
              color: '#64748b',
              callback: function(value: any) {
                if (value >= 1000) {
                  return '$' + (value / 1000) + 'k';
                }
                return '$' + value;
              }
            },
            border: {
              display: false
            }
          }
        }
      }
    });
  }

  onYearChange(): void {
    this.calculateSummary();
    this.calculateMonthlyData();
    this.calculatePercentageChanges();
    this.initChart();
  }

  onChartToggle(): void {
    this.initChart();
  }

  navigateToAddTransaction(): void {
    this.router.navigate(['/add-transaction']);
  }
  navigateToTransfer(): void {
    this.router.navigate(['/transfer']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatCurrencyWithDecimals(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(amount);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getTransactionIcon(transaction: Transaction): string {
    return transaction.category?.icon || 'receipt';
  }

  getTransactionName(transaction: Transaction): string {
    return transaction.note || transaction.category?.name || 'Transaction';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}