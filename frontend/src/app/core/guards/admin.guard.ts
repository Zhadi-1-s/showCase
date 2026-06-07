import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.getCurrentUser()?.role === 'admin') {
    return true;
  }

  void router.navigate(['/admin']);
  return false;
};
