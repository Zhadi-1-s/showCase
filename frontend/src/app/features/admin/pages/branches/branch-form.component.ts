import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BranchPayload } from '../../../../core/models/branch.model';
import { BranchService } from '../../../../core/services/branch.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './branch-form.component.html',
})
export class BranchFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly branchService = inject(BranchService);

  readonly isEdit = signal(false);
  readonly branchId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly productCount = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    workingHours: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    this.branchId.set(id);

    if (!id) {
      return;
    }

    this.loading.set(true);
    this.branchService.getBranchById(id).subscribe({
      next: (res) => {
        const b = res.branch;
        this.productCount.set(res.productCount ?? 0);
        this.form.patchValue({
          name: b.name,
          address: b.address,
          phone: b.phone,
          email: b.email ?? '',
          workingHours: b.workingHours ?? '',
          isActive: b.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Филиал не найден');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: BranchPayload = {
      name: raw.name.trim(),
      address: raw.address.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim() || undefined,
      workingHours: raw.workingHours.trim() || undefined,
      isActive: raw.isActive,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const request = this.isEdit()
      ? this.branchService.updateBranch(this.branchId()!, payload)
      : this.branchService.createBranch(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/admin/branches']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Не удалось сохранить филиал',
        );
      },
    });
  }
}
