import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Branch } from '../../../../core/models/branch.model';
import { Product, ProductCategory } from '../../../../core/models/product.model';
import { BranchService } from '../../../../core/services/branch.service';
import { ProductService } from '../../../../core/services/product.service';
import {
  CatalogFilters,
  FilterPanelComponent,
} from '../../components/filter-panel/filter-panel.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type SortOption = 'new' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    RouterLink,
    FilterPanelComponent,
    ProductCardComponent,
    IconComponent,
  ],
  templateUrl: './product-catalog.component.html',
})
export class ProductCatalogComponent implements OnInit {
  private readonly productsApi = inject(ProductService);
  private readonly branchService = inject(BranchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(12);
  readonly branches = signal<Branch[]>([]);
  readonly filtersOpen = signal(false);
  readonly sort = signal<SortOption>('new');
  readonly initialFilters = signal<Partial<CatalogFilters>>({});

  private lastFilters: CatalogFilters = {
    search: '',
    category: '',
    condition: '',
    branch: '',
    priceMin: null,
    priceMax: null,
  };

  ngOnInit(): void {
    this.branchService.getBranches().subscribe({
      next: (b) => this.branches.set(b),
    });

    this.route.queryParamMap.subscribe((params) => {
      this.initialFilters.set({
        search: params.get('search') ?? '',
        category: params.get('category') ?? '',
        condition: params.get('condition') ?? '',
        branch: params.get('branch') ?? '',
        priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : null,
        priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : null,
      });
      this.lastFilters = {
        search: params.get('search') ?? '',
        category: params.get('category') ?? '',
        condition: params.get('condition') ?? '',
        branch: params.get('branch') ?? '',
        priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : null,
        priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : null,
      };
      const page = Number(params.get('page') ?? 1);
      this.page.set(page);
      this.sort.set((params.get('sort') as SortOption) ?? 'new');
      this.load(page);
    });
  }

  onFiltersApply(filters: CatalogFilters): void {
    this.lastFilters = filters;
    this.filtersOpen.set(false);
    this.navigate({ page: 1 });
  }

  onFiltersReset(): void {
    this.lastFilters = {
      search: '',
      category: '',
      condition: '',
      branch: '',
      priceMin: null,
      priceMax: null,
    };
    this.navigate({ page: 1, clear: true });
  }

  onSortChange(value: string): void {
    this.sort.set(value as SortOption);
    this.navigate({ page: this.page() });
  }

  load(page: number): void {
    this.loading.set(true);
    const f = this.lastFilters;

    this.productsApi
      .getPublishedProducts({
        page,
        limit: this.limit(),
        ...(f.search ? { search: f.search } : {}),
        ...(f.category ? { category: f.category as ProductCategory } : {}),
        ...(f.condition ? { condition: f.condition as Product['condition'] } : {}),
        ...(f.branch ? { branch: f.branch } : {}),
        ...(f.priceMin != null ? { priceMin: f.priceMin } : {}),
        ...(f.priceMax != null ? { priceMax: f.priceMax } : {}),
      })
      .subscribe({
        next: (res) => {
          this.products.set(this.sortProducts(res.products));
          this.total.set(res.total);
          this.page.set(page);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
        },
      });
  }

  goPage(p: number): void {
    this.navigate({ page: p });
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit()));
  }

  private navigate(opts: { page: number; clear?: boolean }): void {
    const f = opts.clear
      ? {
          search: '',
          category: '',
          condition: '',
          branch: '',
          priceMin: null,
          priceMax: null,
        }
      : this.lastFilters;

    const queryParams: Record<string, string | number | null> = {
      page: opts.page,
      sort: this.sort(),
    };
    if (f.search) queryParams['search'] = f.search;
    if (f.category) queryParams['category'] = f.category;
    if (f.condition) queryParams['condition'] = f.condition;
    if (f.branch) queryParams['branch'] = f.branch;
    if (f.priceMin != null) queryParams['priceMin'] = f.priceMin;
    if (f.priceMax != null) queryParams['priceMax'] = f.priceMax;

    void this.router.navigate(['/showcase/catalog'], {
      queryParams,
      queryParamsHandling: opts.clear ? '' : 'merge',
    });
  }

  private sortProducts(items: Product[]): Product[] {
    const list = [...items];
    switch (this.sort()) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      default:
        return list;
    }
  }
}
