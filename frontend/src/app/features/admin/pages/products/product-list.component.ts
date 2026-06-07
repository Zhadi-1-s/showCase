import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Branch } from '../../../../core/models/branch.model';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  Product,
  ProductQuery,
} from '../../../../core/models/product.model';
import { BranchService } from '../../../../core/services/branch.service';
import { ProductService } from '../../../../core/services/product.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import {
  buildWarehouseReport,
  statusPercent,
  WarehouseReport,
} from './warehouse-report.util';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    CurrencyPipe,
  ],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productsApi = inject(ProductService);
  private readonly branchService = inject(BranchService);

  readonly categories = PRODUCT_CATEGORIES;
  readonly statuses = PRODUCT_STATUSES;
  readonly statusPercent = statusPercent;

  readonly loading = signal(true);
  readonly reportLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly branches = signal<Branch[]>([]);
  readonly warehouseReport = signal<WarehouseReport | null>(null);
  readonly reportExpanded = signal(true);

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    category: [''],
    status: [''],
    branch: [''],
  });

  ngOnInit(): void {
    this.branchService.getBranches().subscribe({
      next: (b) => this.branches.set(b),
    });
    this.applyFilters();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.page.set(page);

    this.productsApi.getProducts({ ...this.queryFromFilters(), page, limit: this.limit() }).subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить товары');
        this.loading.set(false);
      },
    });
  }

  loadWarehouseReport(): void {
    this.reportLoading.set(true);
    const baseQuery = this.queryFromFilters();

    this.productsApi
      .getProducts({ ...baseQuery, page: 1, limit: 100 })
      .pipe(
        switchMap((first) => {
          const pageCount = Math.max(1, Math.ceil(first.total / 100));
          if (pageCount <= 1) {
            return of(first.products);
          }
          const rest = Array.from({ length: pageCount - 1 }, (_, i) =>
            this.productsApi
              .getProducts({ ...baseQuery, page: i + 2, limit: 100 })
              .pipe(map((r) => r.products)),
          );
          return forkJoin(rest).pipe(
            map((chunks) => [...first.products, ...chunks.flat()]),
          );
        }),
      )
      .subscribe({
        next: (all) => {
          this.warehouseReport.set(buildWarehouseReport(all));
          this.reportLoading.set(false);
        },
        error: () => {
          this.warehouseReport.set(null);
          this.reportLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.load(1);
    this.loadWarehouseReport();
  }

  resetFilters(): void {
    this.filters.reset();
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const f = this.filters.getRawValue();
    return !!(f.search || f.category || f.status || f.branch);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit()));
  }

  toggleReport(): void {
    this.reportExpanded.update((v) => !v);
  }

  activeFiltersLabel(): string {
    const f = this.filters.getRawValue();
    const parts: string[] = [];
    if (f.search) parts.push(`поиск: «${f.search}»`);
    if (f.category) parts.push(f.category);
    if (f.status) parts.push(f.status);
    if (f.branch) {
      const name = this.branches().find((b) => b._id === f.branch)?.name;
      parts.push(name ?? 'филиал');
    }
    return parts.length ? parts.join(' · ') : 'все товары';
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

  deleteProduct(product: Product): void {
    if (!confirm(`Удалить «${product.name}»?`)) {
      return;
    }
    this.productsApi.deleteProduct(product._id).subscribe({
      next: () => this.applyFilters(),
      error: () => alert('Не удалось удалить товар'),
    });
  }

  onStatusChange(product: Product, status: string): void {
    this.productsApi
      .updateStatus(product._id, status as Product['status'])
      .subscribe({
        next: () => this.applyFilters(),
        error: () => alert('Не удалось обновить статус'),
      });
  }

  productImage(product: Product): string | null {
    return product.photos?.[0] ?? null;
  }

  private queryFromFilters(): ProductQuery {
    const f = this.filters.getRawValue();
    return {
      ...(f.search ? { search: f.search } : {}),
      ...(f.category ? { category: f.category as Product['category'] } : {}),
      ...(f.status ? { status: f.status as Product['status'] } : {}),
      ...(f.branch ? { branch: f.branch } : {}),
    };
  }
}
