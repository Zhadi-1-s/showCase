import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Branch } from '../../../../core/models/branch.model';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchService } from '../../../../core/services/branch.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly branchService = inject(BranchService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly branchesLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly branches = signal<Branch[]>([]);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      branch: [''],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesLoading.set(true);
    this.errorMessage.set(null);

    this.branchService.getBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.branchesLoading.set(false);
      },
      error: () => {
        this.branchesLoading.set(false);
        this.errorMessage.set(
          'Не удалось загрузить филиалы (GET /api/branches). Перезапустите backend: npm run build && npm run start:dev',
        );
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _, ...raw } = this.form.getRawValue();
    const body = {
      name: raw.name,
      email: raw.email,
      password: raw.password,
      ...(raw.branch ? { branch: raw.branch } : {}),
    };

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.register(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
        setTimeout(() => void this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        this.errorMessage.set(
          Array.isArray(msg)
            ? msg.join(', ')
            : (msg ?? 'Не удалось зарегистрироваться'),
        );
      },
    });
  }
}
