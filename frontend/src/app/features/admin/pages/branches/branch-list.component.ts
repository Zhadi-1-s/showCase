import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Branch } from '../../../../core/models/branch.model';
import { BranchService } from '../../../../core/services/branch.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './branch-list.component.html',
})
export class BranchListComponent implements OnInit {
  private readonly branchService = inject(BranchService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly branches = signal<Branch[]>([]);
  readonly actionId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.branchService.getAllBranchesAdmin().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить филиалы');
        this.loading.set(false);
      },
    });
  }

  toggleActive(branch: Branch): void {
    this.actionId.set(branch._id);
    this.branchService.setBranchActive(branch._id, !branch.isActive).subscribe({
      next: () => {
        this.actionId.set(null);
        this.load();
      },
      error: (err) => {
        this.actionId.set(null);
        const msg =
          err?.error?.message ??
          (Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : 'Не удалось изменить статус');
        this.errorMessage.set(msg);
      },
    });
  }

  deleteBranch(branch: Branch): void {
    if (branch.productCount && branch.productCount > 0) {
      this.errorMessage.set('Сначала удалите или перенесите товары филиала');
      return;
    }
    if (!confirm(`Удалить филиал «${branch.name}»?`)) {
      return;
    }

    this.actionId.set(branch._id);
    this.branchService.deleteBranch(branch._id).subscribe({
      next: () => {
        this.actionId.set(null);
        this.load();
      },
      error: (err) => {
        this.actionId.set(null);
        this.errorMessage.set(
          err?.error?.message ?? 'Не удалось удалить филиал',
        );
      },
    });
  }

  isBusy(id: string): boolean {
    return this.actionId() === id;
  }
}
