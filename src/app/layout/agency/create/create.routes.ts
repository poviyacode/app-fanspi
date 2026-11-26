import { Routes } from '@angular/router';
import path from 'path';

export default [
  {
    path: 'post',
    loadComponent: () => import('./create-post/create-post.component'),
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./create-post/create-post.component'),
  },
  // { 
  //   path: '**', 
  //   redirectTo: 'post' 
  // },
] as Routes;
