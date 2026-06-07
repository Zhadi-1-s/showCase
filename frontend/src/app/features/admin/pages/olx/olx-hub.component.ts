import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  OLX_STATUS_LABELS,
  OlxDashboardStats,
  OlxProductRow,
  OlxPublishStatus,
} from '../../../../core/models/olx.model';
import { OlxMockService } from '../../../../core/services/olx-mock.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-olx-hub',
  standalone: true,
  imports: [RouterLink, IconComponent, CurrencyPipe],
  templateUrl: './olx-hub.component.html',
})
export class OlxHubComponent implements OnInit {
  private readonly olx = inject(OlxMockService);

  readonly loading = signal(true);
  readonly rows = signal<OlxProductRow[]>([]);
  readonly stats = signal<OlxDashboardStats | null>(null);
  readonly filter = signal<OlxPublishStatus | 'all'>('all');
  readonly settings = this.olx.settings;
  readonly busyId = this.olx.busyId;
  readonly statusLabels = OLX_STATUS_LABELS;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.olx.loadProducts().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.stats.set(this.olx.getStats(rows));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredRows(): OlxProductRow[] {
    const f = this.filter();
    if (f === 'all') return this.rows();
    return this.rows().filter((r) => r.olx.status === f);
  }

  setFilter(value: OlxPublishStatus | 'all'): void {
    this.filter.set(value);
  }

  publish(row: OlxProductRow): void {
    this.olx.publish(row.productId, row.name).subscribe(() => this.reload());
  }

  unpublish(row: OlxProductRow): void {
    this.olx.unpublish(row.productId).subscribe(() => this.reload());
  }

  sync(row: OlxProductRow): void {
    this.olx.sync(row.productId, row.name).subscribe(() => this.reload());
  }

  isBusy(id: string): boolean {
    return this.busyId() === id;
  }

  canPublish(row: OlxProductRow): boolean {
    return (
      !this.isBusy(row.productId) &&
      (row.olx.status === 'not_published' ||
        row.olx.status === 'removed' ||
        row.olx.status === 'error') &&
      row.productStatus === 'В наличии'
    );
  }

  canUnpublish(row: OlxProductRow): boolean {
    return (
      !this.isBusy(row.productId) && row.olx.status === 'published'
    );
  }

  canSync(row: OlxProductRow): boolean {
    return (
      !this.isBusy(row.productId) &&
      (row.olx.status === 'published' || row.olx.status === 'error')
    );
  }

  statusBadgeClass(status: OlxPublishStatus): string {
    const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold';
    switch (status) {
      case 'published':
        return `${base} bg-emerald-100 text-emerald-800`;
      case 'pending':
        return `${base} bg-amber-100 text-amber-800`;
      case 'error':
        return `${base} bg-red-100 text-red-800`;
      case 'removed':
        return `${base} bg-slate-100 text-slate-600`;
      default:
        return `${base} bg-slate-100 text-slate-500`;
    }
  }

  formatSyncDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
