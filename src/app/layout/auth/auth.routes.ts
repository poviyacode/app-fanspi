import { Routes } from '@angular/router';
import { AuthGuard } from '@guards/auth.guard';
import { NoAuthGuard } from '@guards/no-auth.guard';

export default [
  {
    path: 'login',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./pages/login-auth/login-auth.component')
  },
  {
    path: 'register',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./pages/register-auth/register-auth.component')
  },
  {
    path: 'forgot-password',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./pages/forgot-password-auth/forgot-password-auth.component')
  },
  {
    path: 'reset-password',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./pages/reset-password-auth/reset-password-auth.component')
  },
  {
    path: '**',
    redirectTo: 'login',
  },
] as Routes;
