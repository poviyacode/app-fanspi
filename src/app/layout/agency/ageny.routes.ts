import { Routes, UrlSegment } from '@angular/router';

export default [
  {
    path: 'users',
    loadComponent: () => import('./users-agency/users-agency.component'),
  },
  {
    path: 'multi-chat',
    loadComponent: () => import('./multi-chat/multi-chat.component'),
  },

  { path: '**', redirectTo: 'users' },
] as Routes;
