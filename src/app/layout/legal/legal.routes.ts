import { Routes } from '@angular/router';
import path from 'path';

export default [
  {
    path: '',
    redirectTo: 'terms',
    pathMatch: 'full'
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms-legal/terms-legal.component'),
  },
  {
    path: 'policy',
    loadComponent: () => import('./pages/policy-legal/policy-legal.component'),
  },
] as Routes;
