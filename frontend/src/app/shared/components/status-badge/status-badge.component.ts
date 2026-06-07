import { Component, Input } from '@angular/core';
import { ProductStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="badgeClass">{{ status }}</span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: ProductStatus;

  get badgeClass(): string {
    const base =
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold';
    switch (this.status) {
      case 'В наличии':
        return `${base} bg-emerald-100 text-emerald-800`;
      case 'Зарезервирован':
        return `${base} bg-blue-100 text-blue-800`;
      case 'Продан':
        return `${base} bg-red-100 text-red-800`;
      case 'Скрыт':
        return `${base} bg-slate-100 text-slate-600`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }
}
