import { Injectable, signal } from '@angular/core';
import { delay, map, Observable, of, tap } from 'rxjs';
import {
  OlxDashboardStats,
  OlxIntegrationSettings,
  OlxListingState,
  OlxProductRow,
  OlxPublishStatus,
} from '../models/olx.model';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

const STORAGE_KEY = 'lombard_olx_mock_states';

@Injectable({ providedIn: 'root' })
export class OlxMockService {
  private readonly states = signal<Map<string, OlxListingState>>(this.loadStates());
  readonly busyId = signal<string | null>(null);
  readonly settings = signal<OlxIntegrationSettings>({
    apiConnected: false,
    autoPublishNew: false,
    syncPrice: true,
    defaultCity: 'Алматы',
  });

  constructor(private readonly productsApi: ProductService) {}

  loadProducts(): Observable<OlxProductRow[]> {
    return this.productsApi.getProducts({ limit: 100, page: 1 }).pipe(
      map((res) => res.products.map((p) => this.toRow(p))),
    );
  }

  getStats(rows: OlxProductRow[]): OlxDashboardStats {
    const stats: OlxDashboardStats = {
      published: 0,
      pending: 0,
      errors: 0,
      notPublished: 0,
      removed: 0,
    };
    for (const row of rows) {
      switch (row.olx.status) {
        case 'published':
          stats.published++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'error':
          stats.errors++;
          break;
        case 'removed':
          stats.removed++;
          break;
        default:
          stats.notPublished++;
      }
    }
    return stats;
  }

  publish(productId: string, productName: string): Observable<OlxListingState> {
    return this.simulateAction(productId, () => ({
      productId,
      status: 'published',
      olxAdId: `OLX-MOCK-${productId.slice(-6).toUpperCase()}`,
      olxUrl: `https://www.olx.kz/d/obyavlenie/mock-${encodeURIComponent(productName.slice(0, 20))}-ID${productId.slice(-6)}.html`,
      lastSyncAt: new Date().toISOString(),
      errorMessage: undefined,
    }));
  }

  unpublish(productId: string): Observable<OlxListingState> {
    return this.simulateAction(productId, () => ({
      productId,
      status: 'removed',
      olxAdId: undefined,
      olxUrl: undefined,
      lastSyncAt: new Date().toISOString(),
      errorMessage: undefined,
    }));
  }

  sync(productId: string, productName: string): Observable<OlxListingState> {
    const current = this.getState(productId);
    if (current.status !== 'published') {
      return this.publish(productId, productName);
    }
    return this.simulateAction(productId, () => ({
      ...current,
      lastSyncAt: new Date().toISOString(),
      errorMessage: undefined,
    }));
  }

  simulateError(productId: string): Observable<OlxListingState> {
    return this.simulateAction(productId, () => ({
      productId,
      status: 'error',
      errorMessage: 'OLX API недоступен (макет). Повторите после подключения ключа.',
      lastSyncAt: new Date().toISOString(),
    }));
  }

  getState(productId: string): OlxListingState {
    return (
      this.states().get(productId) ?? {
        productId,
        status: 'not_published',
      }
    );
  }

  private simulateAction(
    productId: string,
    build: () => OlxListingState,
  ): Observable<OlxListingState> {
    this.setPending(productId);
    this.busyId.set(productId);
    return of(build()).pipe(
      delay(1200),
      tap((state) => {
        this.saveState(state);
        this.busyId.set(null);
      }),
    );
  }

  private setPending(productId: string): void {
    this.saveState({
      productId,
      status: 'pending',
      lastSyncAt: new Date().toISOString(),
    });
  }

  private toRow(product: Product): OlxProductRow {
    return {
      productId: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      photo: product.photos?.[0] ?? null,
      productStatus: product.status,
      olx: this.getState(product._id),
    };
  }

  private saveState(state: OlxListingState): void {
    const next = new Map(this.states());
    next.set(state.productId, state);
    this.states.set(next);
    this.persist(next);
  }

  private loadStates(): Map<string, OlxListingState> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as OlxListingState[];
      return new Map(entries.map((s) => [s.productId, s]));
    } catch {
      return new Map();
    }
  }

  private persist(map: Map<string, OlxListingState>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.values()]));
  }
}
