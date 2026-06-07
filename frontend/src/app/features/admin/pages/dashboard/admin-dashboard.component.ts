import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthUser } from '../../../../core/models/auth.model';
import {
  DashboardStatistics,
  DashboardStatusRow,
} from '../../../../core/models/dashboard.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    CurrencyPipe,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(this.auth.getCurrentUser());
  readonly stats = signal<DashboardStatistics | null>(null);

  ngOnInit(): void {
    forkJoin({
      profile: this.auth.loadProfile(),
      statistics: this.dashboard.getStatistics(),
    }).subscribe({
      next: ({ profile, statistics }) => {
        this.user.set(profile.user);
        this.stats.set(statistics);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить данные панели');
        this.loading.set(false);
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }

  sharePercent(row: DashboardStatusRow): number {
    const total = this.stats()?.summary.totalProducts ?? 0;
    if (!total) return 0;
    return Math.round((row.count / total) * 100);
  }

  categoryPercent(count: number): number {
    const total = this.stats()?.summary.totalProducts ?? 0;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }

  statusBarClass(status: string): string {
    switch (status) {
      case 'В наличии':
        return 'bg-emerald-500';
      case 'Зарезервирован':
        return 'bg-blue-500';
      case 'Продан':
        return 'bg-red-400';
      case 'Скрыт':
        return 'bg-slate-400';
      default:
        return 'bg-slate-300';
    }
  }

  productThumb(product: { photos?: string[] }): string | null {
    return product.photos?.[0] ?? null;
  }
}
