import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTelegramChannelRequest,
  TelegramChannel,
  TelegramHubResponse,
} from '../models/telegram.model';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  readonly busyKey = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  loadHub(): Observable<TelegramHubResponse> {
    return this.http.get<TelegramHubResponse>(`${environment.apiUrl}/telegram/hub`);
  }

  createChannel(body: CreateTelegramChannelRequest): Observable<{ channel: TelegramChannel }> {
    return this.http.post<{ channel: TelegramChannel }>(
      `${environment.apiUrl}/telegram/channels`,
      body,
    );
  }

  updateChannel(
    id: string,
    body: Partial<CreateTelegramChannelRequest>,
  ): Observable<{ channel: TelegramChannel }> {
    return this.http.put<{ channel: TelegramChannel }>(
      `${environment.apiUrl}/telegram/channels/${id}`,
      body,
    );
  }

  deleteChannel(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${environment.apiUrl}/telegram/channels/${id}`,
    );
  }

  publish(productId: string, channelId: string): Observable<unknown> {
    const key = `${productId}:${channelId}:publish`;
    this.busyKey.set(key);
    return this.http
      .post(`${environment.apiUrl}/telegram/products/${productId}/publish`, {
        channelId,
      })
      .pipe(tap({ finalize: () => this.busyKey.set(null) }));
  }

  unpublish(productId: string, channelId: string): Observable<unknown> {
    const key = `${productId}:${channelId}:unpublish`;
    this.busyKey.set(key);
    return this.http
      .post(`${environment.apiUrl}/telegram/products/${productId}/unpublish`, {
        channelId,
      })
      .pipe(tap({ finalize: () => this.busyKey.set(null) }));
  }

  sync(productId: string, channelId: string): Observable<unknown> {
    const key = `${productId}:${channelId}:sync`;
    this.busyKey.set(key);
    return this.http
      .post(`${environment.apiUrl}/telegram/products/${productId}/sync`, {
        channelId,
      })
      .pipe(tap({ finalize: () => this.busyKey.set(null) }));
  }
}
