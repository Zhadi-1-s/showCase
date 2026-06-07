import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AdminLayoutComponent } from './features/admin/layouts/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';
import { BranchFormComponent } from './features/admin/pages/branches/branch-form.component';
import { BranchListComponent } from './features/admin/pages/branches/branch-list.component';
import { OlxHubComponent } from './features/admin/pages/olx/olx-hub.component';
import { TelegramHubComponent } from './features/admin/pages/telegram/telegram-hub.component';
import { ProductFormComponent } from './features/admin/pages/products/product-form.component';
import { ProductListComponent } from './features/admin/pages/products/product-list.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { ProductCatalogComponent } from './features/showcase/pages/catalog/product-catalog.component';
import { ShowcaseHomeComponent } from './features/showcase/pages/home/showcase-home.component';
import { ProductDetailComponent } from './features/showcase/pages/product-detail/product-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'showcase' },
  { path: 'showcase', component: ShowcaseHomeComponent },
  { path: 'showcase/catalog', component: ProductCatalogComponent },
  { path: 'showcase/product/:id', component: ProductDetailComponent },
  {
    path: 'auth',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard],
      },
      { path: 'register', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '' },
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/:id/edit', component: ProductFormComponent },
      { path: 'olx', component: OlxHubComponent },
      { path: 'telegram', component: TelegramHubComponent },
      {
        path: 'branches',
        component: BranchListComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'branches/new',
        component: BranchFormComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'branches/:id/edit',
        component: BranchFormComponent,
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'showcase' },
];
