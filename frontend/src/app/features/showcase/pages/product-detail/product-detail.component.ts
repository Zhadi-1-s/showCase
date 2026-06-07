import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  getBranchDetails,
  Product,
  ProductCategory,
} from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { ConditionStarsComponent } from '../../components/condition-stars/condition-stars.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    ConditionStarsComponent,
    ProductCardComponent,
  ],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly product = signal<Product | null>(null);
  readonly similar = signal<Product[]>([]);
  readonly activePhoto = signal(0);
  readonly contactOpen = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.productsApi.getPublishedProductById(id).subscribe({
      next: (res) => {
        this.product.set(res.product);
        this.loading.set(false);
        this.loadSimilar(res.product);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  branch() {
    const p = this.product();
    return p ? getBranchDetails(p) : null;
  }

  photos(): string[] {
    return this.product()?.photos ?? [];
  }

  setPhoto(index: number): void {
    this.activePhoto.set(index);
  }

  private loadSimilar(product: Product): void {
    this.productsApi
      .getPublishedProducts({
        category: product.category as ProductCategory,
        limit: 8,
      })
      .subscribe({
        next: (res) => {
          this.similar.set(
            res.products.filter((p) => p._id !== product._id).slice(0, 4),
          );
        },
      });
  }
}
