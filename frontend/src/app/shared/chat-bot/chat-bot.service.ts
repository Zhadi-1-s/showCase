import { Injectable, inject, signal } from '@angular/core';
import { Branch } from '../../core/models/branch.model';
import { BranchService } from '../../core/services/branch.service';
import {
  CHAT_FALLBACK,
  CHAT_KNOWLEDGE,
  CHAT_QUICK_QUESTIONS,
  CHAT_WELCOME,
  ChatBotLink,
  ChatBotReply,
  ChatQuickQuestion,
} from './chat-bot.knowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  links?: ChatBotLink[];
  time: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatBotService {
  private readonly branchService = inject(BranchService);
  private readonly branches = signal<Branch[]>([]);
  private idSeq = 0;

  readonly open = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly initialized = signal(false);

  constructor() {
    this.branchService.getBranches().subscribe({
      next: (b) => this.branches.set(b),
      error: () => this.branches.set([]),
    });
  }

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openChat();
    }
  }

  openChat(): void {
    this.open.set(true);
    if (!this.initialized()) {
      this.initialized.set(true);
      this.pushBot(CHAT_WELCOME);
    }
  }

  close(): void {
    this.open.set(false);
  }

  getQuickQuestions(): ChatQuickQuestion[] {
    return CHAT_QUICK_QUESTIONS;
  }

  ask(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.pushUser(trimmed);
    const reply = this.resolveReply(trimmed);
    this.pushBot(reply);
  }

  askQuick(question: ChatQuickQuestion): void {
    this.ask(question.message);
  }

  private resolveReply(input: string): ChatBotReply {
    const normalized = this.normalize(input);
    let best: { ruleId: string; score: number } | null = null;

    for (const rule of CHAT_KNOWLEDGE) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (normalized.includes(this.normalize(kw))) {
          score += kw.length >= 4 ? 2 : 1;
        }
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { ruleId: rule.id, score };
      }
    }

    const rule = best
      ? CHAT_KNOWLEDGE.find((r) => r.id === best!.ruleId)
      : null;

    const base = rule?.reply ?? CHAT_FALLBACK;

    const withContacts = ['hours', 'contacts', 'branches', 'pawn'];
    if (rule && withContacts.includes(rule.id)) {
      return this.enrichWithBranches(base);
    }

    if (!rule) {
      return this.enrichWithBranches(base);
    }

    return { ...base, links: base.links ? [...base.links] : undefined };
  }

  private enrichWithBranches(reply: ChatBotReply): ChatBotReply {
    const list = this.branches();
    if (!list.length) {
      return {
        ...reply,
        text: `${reply.text}\n\nКонтакты филиалов уточняйте по телефону на карточке товара в каталоге.`,
      };
    }

    const lines = list
      .slice(0, 5)
      .map((b) => {
        const hours = b.workingHours ? ` · ${b.workingHours}` : '';
        return `• ${b.name}: ${b.phone}, ${b.address}${hours}`;
      })
      .join('\n');

    return {
      ...reply,
      text: `${reply.text}\n\n${lines}`,
    };
  }

  private normalize(text: string): string {
    return text.toLowerCase().replace(/ё/g, 'е').trim();
  }

  private pushUser(text: string): void {
    this.messages.update((list) => [
      ...list,
      {
        id: this.nextId(),
        role: 'user',
        text,
        time: new Date(),
      },
    ]);
  }

  private pushBot(reply: ChatBotReply): void {
    this.messages.update((list) => [
      ...list,
      {
        id: this.nextId(),
        role: 'bot',
        text: reply.text,
        links: reply.links,
        time: new Date(),
      },
    ]);
  }

  private nextId(): string {
    this.idSeq += 1;
    return `msg-${this.idSeq}`;
  }
}
