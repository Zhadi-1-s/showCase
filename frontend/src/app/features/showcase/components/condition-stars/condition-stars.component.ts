import { Component, Input } from '@angular/core';
import {
  conditionScore,
  ProductCondition,
} from '../../../../core/models/product.model';

@Component({
  selector: 'app-condition-stars',
  standalone: true,
  template: `
    <div class="flex items-center gap-0.5" [attr.aria-label]="'Состояние: ' + condition">
      @for (i of [1, 2, 3, 4]; track i) {
        <span
          class="h-2 w-2 rounded-full"
          [class.bg-gold-400]="i <= filled"
          [class.bg-slate-200]="i > filled"
        ></span>
      }
      <span class="ml-2 text-xs text-slate-500">{{ condition }}</span>
    </div>
  `,
})
export class ConditionStarsComponent {
  @Input({ required: true }) condition!: ProductCondition;

  get filled(): number {
    return conditionScore(this.condition);
  }
}
