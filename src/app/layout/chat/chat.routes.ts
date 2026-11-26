import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/users-chat/users-chat.component')
  },
  {
    path: 'messages/:idChat',
    loadComponent: () => import('./pages/messages-chat/messages-chat.component'),
    children: [
      {
        path: ':slug',
        loadComponent: () => import('../post/pages/details-post/details-post.component'),
      },
    ]
  },
  {
    path: 'gallery/:idChat',
    loadComponent: () => import('./pages/gallery-chat/gallery-chat.component'),
  },
  {
    path: 'gallery/:idChat/:status',
    loadComponent: () => import('./pages/gallery-chat/gallery-chat.component'),
  },
  { path: '**', redirectTo: '' },
] as Routes;
