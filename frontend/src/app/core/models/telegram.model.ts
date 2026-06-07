export type TelegramSummaryStatus = 'published' | 'error' | 'not_published';

export type TelegramPublicationStatus = 'published' | 'error' | 'removed';

export interface TelegramBotStatus {
  configured: boolean;
  connected: boolean;
  username?: string;
  name?: string;
}

export interface TelegramChannel {
  id: string;
  name: string;
  chatId: string;
  username?: string;
  description?: string;
  isActive: boolean;
}

export interface TelegramPublicationRow {
  id: string;
  channelId: string;
  channelName: string;
  status: TelegramPublicationStatus;
  messageId?: number;
  postUrl?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface TelegramProductRow {
  productId: string;
  name: string;
  price: number;
  category: string;
  productStatus: string;
  photo?: string;
  branchName?: string;
  publications: TelegramPublicationRow[];
  summaryStatus: TelegramSummaryStatus;
}

export interface TelegramHubStats {
  published: number;
  errors: number;
  notPublished: number;
  total: number;
}

export interface TelegramHubResponse {
  bot: TelegramBotStatus;
  channels: TelegramChannel[];
  stats: TelegramHubStats;
  items: TelegramProductRow[];
}

export interface CreateTelegramChannelRequest {
  name: string;
  chatId: string;
  username?: string;
  description?: string;
  isActive?: boolean;
}

export const TELEGRAM_STATUS_LABELS: Record<TelegramSummaryStatus, string> = {
  published: 'В канале',
  error: 'Ошибка',
  not_published: 'Не опубликовано',
};

export const TELEGRAM_PUB_STATUS_LABELS: Record<
  TelegramPublicationStatus,
  string
> = {
  published: 'Опубликовано',
  error: 'Ошибка',
  removed: 'Снято',
};
