import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Branch } from '../../../../core/models/branch.model';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
} from '../../../../core/models/product.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface CatalogFilters {
  search: string;
  category: string;
  condition: string;
  branch: string;
  priceMin: number | null;
  priceMax: number | null;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent {
  private readonly fb = new FormBuilder();

  @Input() branches: Branch[] = [];
  @Input() set initial(value: Partial<CatalogFilters> | null) {
    if (value) {
      this.form.patchValue({
        search: value.search ?? '',
        category: value.category ?? '',
        condition: value.condition ?? '',
        branch: value.branch ?? '',
        priceMin: value.priceMin ?? null,
        priceMax: value.priceMax ?? null,
      });
    }
  }

  @Output() readonly apply = new EventEmitter<CatalogFilters>();
  @Output() readonly reset = new EventEmitter<void>();

  readonly categories = PRODUCT_CATEGORIES;
  readonly conditions = PRODUCT_CONDITIONS;
  readonly expandedCategories = signal(true);
  readonly expandedPrice = signal(true);

  readonly form = this.fb.nonNullable.group({
    search: [''],
    category: [''],
    condition: [''],
    branch: [''],
    priceMin: [null as number | null],
    priceMax: [null as number | null],
  });

  submit(): void {
    this.apply.emit(this.form.getRawValue());
  }

  clear(): void {
    this.form.reset();
    this.reset.emit();
  }

  toggleCategory(cat: string): void {
    const current = this.form.controls.category.value;
    this.form.controls.category.setValue(current === cat ? '' : cat);
  }

  isCategoryActive(cat: string): boolean {
    return this.form.controls.category.value === cat;
  }
}
