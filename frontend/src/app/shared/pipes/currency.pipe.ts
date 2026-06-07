import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appCurrency', standalone: true })
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return `${value.toLocaleString('ru-RU')} ₸`;
  }
}
