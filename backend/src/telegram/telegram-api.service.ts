import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; username?: string; title?: string };
}

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.getToken());
  }

  private getToken(): string | undefined {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    return token || undefined;
  }

  private baseUrl(): string {
    const token = this.getToken();
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не задан');
    }
    return `https://api.telegram.org/bot${token}`;
  }

  async getMe(): Promise<TelegramBotInfo | null> {
    if (!this.isConfigured) return null;
    try {
      const data = await this.request<TelegramBotInfo>('getMe');
      return data.result ?? null;
    } catch (err) {
      this.logger.warn(`getMe failed: ${String(err)}`);
      return null;
    }
  }

  async getChat(chatId: string): Promise<{ title?: string; username?: string } | null> {
    try {
      const data = await this.request<{ title?: string; username?: string }>(
        'getChat',
        { chat_id: chatId },
      );
      return data.result ?? null;
    } catch {
      return null;
    }
  }

  async sendPhoto(
    chatId: string,
    photoUrl: string,
    caption: string,
  ): Promise<TelegramMessage> {
    const data = await this.request<TelegramMessage>('sendPhoto', {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
    });
    if (!data.result) {
      throw new Error('Telegram не вернул message_id');
    }
    return data.result;
  }

  async sendMessage(chatId: string, text: string): Promise<TelegramMessage> {
    const data = await this.request<TelegramMessage>('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });
    if (!data.result) {
      throw new Error('Telegram не вернул message_id');
    }
    return data.result;
  }

  async deleteMessage(chatId: string, messageId: number): Promise<void> {
    await this.request('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async editMessageCaption(
    chatId: string,
    messageId: number,
    caption: string,
  ): Promise<void> {
    await this.request('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      caption,
      parse_mode: 'HTML',
    });
  }

  buildPostUrl(channelUsername: string | undefined, messageId: number): string | undefined {
    if (!channelUsername) return undefined;
    const username = channelUsername.replace(/^@/, '');
    return `https://t.me/${username}/${messageId}`;
  }

  private async request<T>(
    method: string,
    body?: Record<string, unknown>,
  ): Promise<TelegramApiResponse<T>> {
    const url = `${this.baseUrl()}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!data.ok) {
      throw new Error(data.description ?? `Telegram API error (${method})`);
    }
    return data;
  }
}
