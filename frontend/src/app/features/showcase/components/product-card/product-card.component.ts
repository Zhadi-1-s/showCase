import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../core/models/product.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { ConditionStarsComponent } from '../condition-stars/condition-stars.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    ConditionStarsComponent,
  ],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  imageUrl(): string | null {
    return this.product.photos?.[0] ?? null;
  }
}
