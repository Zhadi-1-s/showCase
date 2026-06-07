import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TELEGRAM_PUB_STATUS_LABELS,
  TELEGRAM_STATUS_LABELS,
  TelegramChannel,
  TelegramHubStats,
  TelegramProductRow,
  TelegramSummaryStatus,
} from '../../../../core/models/telegram.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TelegramService } from '../../../../core/services/telegram.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-telegram-hub',
  standalone: true,
  imports: [RouterLink, IconComponent, CurrencyPipe],
  templateUrl: './telegram-hub.component.html',
})
export class TelegramHubComponent implements OnInit {
  private readonly telegram = inject(TelegramService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly botConnected = signal(false);
  readonly botUsername = signal<string | undefined>(undefined);
  readonly botConfigured = signal(false);
  readonly channels = signal<TelegramChannel[]>([]);
  readonly rows = signal<TelegramProductRow[]>([]);
  readonly stats = signal<TelegramHubStats | null>(null);
  readonly filter = signal<TelegramSummaryStatus | 'all'>('all');
  readonly busyKey = this.telegram.busyKey;
  readonly statusLabels = TELEGRAM_STATUS_LABELS;
  readonly pubStatusLabels = TELEGRAM_PUB_STATUS_LABELS;

  readonly showChannelForm = signal(false);
  readonly channelForm = signal({ name: '', chatId: '', username: '', description: '' });
  readonly selectedChannelByProduct = signal<Record<string, string>>({});
  readonly channelSaving = signal(false);
  readonly channelError = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.telegram.loadHub().subscribe({
      next: (hub) => {
        this.botConfigured.set(hub.bot.configured);
        this.botConnected.set(hub.bot.connected);
        this.botUsername.set(hub.bot.username);
        this.channels.set(hub.channels);
        this.rows.set(hub.items);
        this.stats.set(hub.stats);
        this.initDefaultChannels(hub.channels, hub.items);
        if (this.canAddChannel() && hub.channels.length === 0) {
          this.showChannelForm.set(true);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Не удалось загрузить данные Telegram');
        this.loading.set(false);
      },
    });
  }

  filteredRows(): TelegramProductRow[] {
    const f = this.filter();
    if (f === 'all') return this.rows();
    return this.rows().filter((r) => r.summaryStatus === f);
  }

  setFilter(value: TelegramSummaryStatus | 'all'): void {
    this.filter.set(value);
  }

  activeChannels(): TelegramChannel[] {
    return this.channels().filter((c) => c.isActive);
  }

  getSelectedChannel(productId: string): string {
    return this.selectedChannelByProduct()[productId] ?? this.activeChannels()[0]?.id ?? '';
  }

  setSelectedChannel(productId: string, channelId: string): void {
    this.selectedChannelByProduct.update((m) => ({ ...m, [productId]: channelId }));
  }

  publishedInChannel(row: TelegramProductRow, channelId: string) {
    return row.publications.find(
      (p) => p.channelId === channelId && p.status === 'published',
    );
  }

  canPublish(row: TelegramProductRow): boolean {
    if (row.productStatus !== 'В наличии') return false;
    const chId = this.getSelectedChannel(row.productId);
    if (!chId) return false;
    return !this.publishedInChannel(row, chId);
  }

  canSync(row: TelegramProductRow): boolean {
    const chId = this.getSelectedChannel(row.productId);
    return Boolean(this.publishedInChannel(row, chId));
  }

  canUnpublish(row: TelegramProductRow): boolean {
    return this.canSync(row);
  }

  isBusy(productId: string, channelId: string): boolean {
    const key = this.busyKey();
    return (
      key === `${productId}:${channelId}:publish` ||
      key === `${productId}:${channelId}:unpublish` ||
      key === `${productId}:${channelId}:sync`
    );
  }

  publish(row: TelegramProductRow): void {
    const channelId = this.getSelectedChannel(row.productId);
    if (!channelId) return;
    this.telegram.publish(row.productId, channelId).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.message ?? 'Ошибка публикации'),
    });
  }

  unpublish(row: TelegramProductRow): void {
    const channelId = this.getSelectedChannel(row.productId);
    if (!channelId) return;
    this.telegram.unpublish(row.productId, channelId).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.message ?? 'Ошибка снятия'),
    });
  }

  sync(row: TelegramProductRow): void {
    const channelId = this.getSelectedChannel(row.productId);
    if (!channelId) return;
    this.telegram.sync(row.productId, channelId).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.message ?? 'Ошибка синхронизации'),
    });
  }

  statusBadgeClass(status: TelegramSummaryStatus): string {
    const base = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium';
    switch (status) {
      case 'published':
        return `${base} bg-emerald-100 text-emerald-800`;
      case 'error':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }

  formatSyncDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'admin';
  }

  canAddChannel(): boolean {
    const role = this.auth.getCurrentUser()?.role;
    return role === 'admin' || role === 'employee';
  }

  toggleChannelForm(): void {
    if (!this.canAddChannel()) return;
    this.showChannelForm.update((v) => !v);
    this.channelError.set(null);
  }

  updateChannelField(
    field: 'name' | 'chatId' | 'username' | 'description',
    value: string,
  ): void {
    this.channelForm.update((f) => ({ ...f, [field]: value }));
  }

  saveChannel(): void {
    if (!this.canAddChannel()) return;
    const form = this.channelForm();
    if (!form.chatId.trim()) {
      this.channelError.set('Укажите chat_id канала (@username или -100…)');
      return;
    }
    this.channelSaving.set(true);
    this.channelError.set(null);
    this.telegram
      .createChannel({
        name: form.name.trim() || form.chatId.trim(),
        chatId: form.chatId.trim(),
        username: form.username.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.channelForm.set({ name: '', chatId: '', username: '', description: '' });
          this.showChannelForm.set(false);
          this.channelSaving.set(false);
          this.reload();
        },
        error: (err) => {
          this.channelError.set(err?.error?.message ?? 'Не удалось добавить канал');
          this.channelSaving.set(false);
        },
      });
  }

  removeChannel(channel: TelegramChannel): void {
    if (!confirm(`Удалить канал «${channel.name}»?`)) return;
    this.telegram.deleteChannel(channel.id).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.message ?? 'Не удалось удалить канал'),
    });
  }

  toggleChannelActive(channel: TelegramChannel): void {
    this.telegram.updateChannel(channel.id, { isActive: !channel.isActive }).subscribe({
      next: () => this.reload(),
      error: (err) => alert(err?.error?.message ?? 'Ошибка обновления канала'),
    });
  }

  private initDefaultChannels(
    channels: TelegramChannel[],
    items: TelegramProductRow[],
  ): void {
    const firstActive = channels.find((c) => c.isActive)?.id;
    if (!firstActive) return;
    const map: Record<string, string> = {};
    for (const item of items) {
      map[item.productId] = firstActive;
    }
    this.selectedChannelByProduct.set(map);
  }
}
