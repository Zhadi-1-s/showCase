import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Branch } from '../../../../core/models/branch.model';
import {
  getBranchId,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  ProductCategory,
  ProductCondition,
  ProductPayload,
  ProductStatus,
} from '../../../../core/models/product.model';
import { BranchService } from '../../../../core/services/branch.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { ProductService } from '../../../../core/services/product.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductService);
  private readonly branchService = inject(BranchService);
  private readonly uploadService = inject(FileUploadService);

  readonly categories = PRODUCT_CATEGORIES;
  readonly conditions = PRODUCT_CONDITIONS;
  readonly statuses = PRODUCT_STATUSES;

  readonly isEdit = signal(false);
  readonly productId = signal<string | null>(null);
  readonly photos = signal<string[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['' as ProductCategory | '', Validators.required],
    brand: [''],
    model: [''],
    description: [''],
    condition: ['отличное' as ProductCondition, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    branch: ['', Validators.required],
    status: ['В наличии' as ProductStatus, Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    this.productId.set(id);

    this.loading.set(true);
    this.branchService.getBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        if (!id) {
          this.loading.set(false);
          return;
        }
        this.productsApi.getProductById(id).subscribe({
          next: (res) => {
            const p = res.product;
            this.form.patchValue({
              name: p.name,
              category: p.category,
              brand: p.brand ?? '',
              model: p.model ?? '',
              description: p.description ?? '',
              condition: p.condition,
              price: p.price,
              branch: getBranchId(p.branch),
              status: p.status,
            });
            this.photos.set([...p.photos]);
            this.loading.set(false);
          },
          error: () => {
            this.errorMessage.set('Товар не найден');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.errorMessage.set('Не удалось загрузить филиалы');
        this.loading.set(false);
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) {
      return;
    }
    this.uploadFiles(files);
  }

  uploadFiles(files: File[]): void {
    this.uploading.set(true);
    this.errorMessage.set(null);

    if (files.length === 1) {
      this.uploadService.uploadFile(files[0]).subscribe({
        next: (res) => {
          this.photos.update((list) => [...list, res.url]);
          this.uploading.set(false);
        },
        error: () => this.onUploadError(),
      });
    } else {
      this.uploadService.uploadMultiple(files).subscribe({
        next: (res) => {
          this.photos.update((list) => [...list, ...res.urls]);
          this.uploading.set(false);
        },
        error: () => this.onUploadError(),
      });
    }
  }

  removePhoto(url: string): void {
    const id = this.productId();
    if (this.isEdit() && id) {
      this.productsApi.deletePhoto(id, url).subscribe({
        next: (res) => this.photos.set([...res.product.photos]),
        error: () => alert('Не удалось удалить фото'),
      });
    } else {
      this.photos.update((list) => list.filter((u) => u !== url));
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ProductPayload = {
      name: raw.name.trim(),
      category: raw.category as ProductCategory,
      brand: raw.brand.trim() || undefined,
      model: raw.model.trim() || undefined,
      description: raw.description.trim() || undefined,
      condition: raw.condition,
      price: Number(raw.price),
      photos: this.photos(),
      branch: raw.branch,
      status: raw.status,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.productId();
    const request = id
      ? this.productsApi.updateProduct(id, payload)
      : this.productsApi.createProduct(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message;
        this.errorMessage.set(
          Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Ошибка сохранения'),
        );
      },
    });
  }

  private onUploadError(): void {
    this.uploading.set(false);
    this.errorMessage.set('Ошибка загрузки фото. Проверьте Cloudinary и JWT.');
  }
}
