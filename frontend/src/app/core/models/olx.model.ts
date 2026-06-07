export type OlxPublishStatus =
  | 'not_published'
  | 'pending'
  | 'published'
  | 'error'
  | 'removed';

export interface OlxListingState {
  productId: string;
  status: OlxPublishStatus;
  olxAdId?: string;
  olxUrl?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface OlxProductRow {
  productId: string;
  name: string;
  category: string;
  price: number;
  photo: string | null;
  productStatus: string;
  olx: OlxListingState;
}

export interface OlxDashboardStats {
  published: number;
  pending: number;
  errors: number;
  notPublished: number;
  removed: number;
}

export const OLX_STATUS_LABELS: Record<OlxPublishStatus, string> = {
  not_published: 'Не на OLX',
  pending: 'Публикация…',
  published: 'На OLX',
  error: 'Ошибка',
  removed: 'Снято с OLX',
};

export interface OlxIntegrationSettings {
  apiConnected: boolean;
  autoPublishNew: boolean;
  syncPrice: boolean;
  defaultCity: string;
}
