import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatBotService } from '../../chat-bot/chat-bot.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './chat-widget.component.html',
})
export class ChatWidgetComponent implements AfterViewChecked {
  readonly chat = inject(ChatBotService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly input = this.fb.nonNullable.control('');
  readonly quickPanelOpen = signal(true);
  private shouldScroll = false;

  private readonly scrollEl = viewChild<ElementRef<HTMLDivElement>>('messagesEl');

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  openChat(): void {
    this.chat.openChat();
    this.quickPanelOpen.set(true);
  }

  close(): void {
    this.chat.close();
  }

  showQuickPanel(): void {
    this.quickPanelOpen.set(true);
    this.shouldScroll = true;
  }

  submit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const text = this.input.value.trim();
    if (!text) return;

    this.chat.ask(text);
    this.input.reset('');
    this.shouldScroll = true;
  }

  onQuick(message: string): void {
    this.quickPanelOpen.set(false);
    this.chat.ask(message);
    this.shouldScroll = true;
  }

  navigateLink(route: string, queryParams?: Record<string, string>): void {
    void this.router.navigate([route], { queryParams });
    this.chat.close();
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private scrollToBottom(): void {
    const el = this.scrollEl()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
