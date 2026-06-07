import { AsyncPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { Product, ProductCategory } from '../../../../core/models/product.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductService } from '../../../../core/services/product.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-showcase-home',
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    IconComponent,
    ProductCardComponent,
    CurrencyPipe,
  ],
  templateUrl: './showcase-home.component.html',
})
export class ShowcaseHomeComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly productsApi = inject(ProductService);
  private readonly router = inject(Router);

  readonly recentProducts = signal<Product[]>([]);
  readonly loadingRecent = signal(true);
  readonly heroSearch = signal('');
  readonly searchSuggestions = signal<Product[]>([]);
  readonly searchLoading = signal(false);
  readonly searchDropdownOpen = signal(false);

  private readonly searchBox = viewChild<ElementRef<HTMLElement>>('searchBox');
  private readonly searchTerms = new Subject<string>();
  private searchSub?: Subscription;
  private documentClickHandler = (e: MouseEvent) => this.onDocumentClick(e);

  readonly categories: { label: ProductCategory; icon: 'package' | 'sparkles' }[] = [
    { label: 'смартфоны', icon: 'package' },
    { label: 'ноутбуки', icon: 'package' },
    { label: 'часы', icon: 'sparkles' },
    { label: 'золото', icon: 'sparkles' },
    { label: 'техника', icon: 'package' },
    { label: 'аксессуары', icon: 'package' },
  ];

  ngOnInit(): void {
    this.productsApi.getPublishedProducts({ limit: 8 }).subscribe({
      next: (res) => {
        this.recentProducts.set(res.products);
        this.loadingRecent.set(false);
      },
      error: () => this.loadingRecent.set(false),
    });

    this.searchSub = this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const term = q.trim();
          if (term.length < 2) {
            this.searchSuggestions.set([]);
            this.searchDropdownOpen.set(false);
            this.searchLoading.set(false);
            return of(null);
          }
          this.searchLoading.set(true);
          return this.productsApi.getPublishedProducts({ search: term, limit: 6 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.searchLoading.set(false);
          if (!res) return;
          this.searchSuggestions.set(res.products);
          this.searchDropdownOpen.set(true);
        },
        error: () => {
          this.searchLoading.set(false);
          this.searchSuggestions.set([]);
        },
      });

    document.addEventListener('click', this.documentClickHandler);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    document.removeEventListener('click', this.documentClickHandler);
  }

  onSearchInput(value: string): void {
    this.heroSearch.set(value);
    this.searchTerms.next(value);
  }

  onSearchFocus(): void {
    if (this.heroSearch().trim().length >= 2 && this.searchSuggestions().length) {
      this.searchDropdownOpen.set(true);
    }
  }

  closeSearchDropdown(): void {
    this.searchDropdownOpen.set(false);
  }

  searchCatalog(): void {
    const q = this.heroSearch().trim();
    this.closeSearchDropdown();
    void this.router.navigate(['/showcase/catalog'], {
      queryParams: q ? { search: q } : {},
    });
  }

  productThumb(product: Product): string | null {
    return product.photos?.[0] ?? null;
  }

  categoryLink(): string[] {
    return ['/showcase/catalog'];
  }

  categoryQuery(category: string) {
    return { category };
  }

  private onDocumentClick(event: MouseEvent): void {
    const box = this.searchBox()?.nativeElement;
    if (box && !box.contains(event.target as Node)) {
      this.closeSearchDropdown();
    }
  }
}
