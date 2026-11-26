import { Routes, UrlSegment } from '@angular/router';

export default [
  {
    path: 'setting',
    loadComponent: () => import('./setting/pages/main-setting/main-setting.component'),
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./setting/pages/profile-setting/profile-setting.component'),
      },
      {
        path: 'account',
        loadComponent: () => import('./setting/pages/account-setting/account-setting.component'),
      },
      {
        path: 'membership',
        loadComponent: () => import('./setting/pages/membership-setting/membership-setting.component'),
      },
      {
        path: 'payment',
        loadComponent: () => import('./setting/pages/payment-method-setting/pages/list-payment-method-setting/list-payment-method-setting.component'),
      },
      {
        path: 'notification',
        loadComponent: () => import('./setting/pages/notification-setting/notification-setting.component'),
      },
      {
        path: 'creator-onboarding',
        loadComponent: () => import('./setting/pages/creator-onboarding/creator-onboarding.component'),
      },
      {
        path: 'lovense',
        loadComponent: () => import('./setting/pages/lovense-setting/lovense-setting.component'),
      },
      //{ path: '**', redirectTo: 'account' },
    ]
  },
  // {
  //   path: 'profile',
  //   loadComponent: () => import('../admin/profile/profile.component'),
  // },
  {
    path: 'personal',
    loadComponent: () => import('./setting/pages/personal-setting/personal-setting.component'),
  },
  {
    path: 'activity',
    loadComponent: () => import('./activity/pages/list-activity/list-activity.component'),
  },
  {
    path: 'incomes',
    loadComponent: () => import('./incomes/pages/main-incomes/main-incomes.component'),
    children: [
      {
        path: ':status',
        loadComponent: () => import('./incomes/pages/list-incomes/list-incomes.component'),
      },
      { path: '**', redirectTo: 'active' },
    ]
  },
  {
    path: 'purchases/:status',
    loadComponent: () => import('./purchases/pages/list-purchases/list-purchases.component'),
    // children: [
    //   {
    //     path: ':status',
    //     loadComponent: () => import('./purchases/pages/list-purchases/list-purchases.component'),
    //   },
    //   { path: '**', redirectTo: 'active' },
    // ]
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./bookmarks/pages/posts-bookmarks/posts-bookmarks.component'),
    children: [
      {
        path: 'posts/pu/:slug',
        loadComponent: () => import('../../layout/post/pages/details-post/details-post.component'),
      },
    ]
  },
  {
    path: 'community',
    loadComponent: () => import('./community/main-community/main-community.component'),
    children: [
      // --- Rutas para SUBSCRIPTIONS (Con y sin estado) ---
      {
        path: 'subscriptions',
        loadComponent: () => import('./community/subscriptions/pages/list-subscriptions/list-subscriptions.component'),
      },
      {
        path: 'subscriptions/:status',
        loadComponent: () => import('./community/subscriptions/pages/list-subscriptions/list-subscriptions.component'),
      },

      // --- Rutas para SUBSCRIBERS (Con y sin estado) ---
      {
        path: 'subscribers',
        loadComponent: () => import('./community/subscribers/pages/list-subscribers/list-subscribers.component'),
      },
      {
        path: 'subscribers/:status',
        loadComponent: () => import('./community/subscribers/pages/list-subscribers/list-subscribers.component'),
      },

      // Comodín seguro: Si no es ninguna, redirige a la raíz de subscriptions
      { path: '**', redirectTo: 'subscriptions' },
    ]
  },
  {
    path: 'peer-transfers',
    children: [
      { path: '', redirectTo: 'pending', pathMatch: 'full' },
      {
        path: ':status',
        loadComponent: () => import('./peer-transfer/pages/list-peer-transfer/list-peer-transfer.component')
      }
    ]
  },
  {
    path: 'ads',
    loadComponent: () => import('./ads/pages/list-ads/list-ads.component'),
  },

  // {
  //   path: 'subscribers',
  //   loadComponent: () => import('./subscribers/pages/main-subscribers/main-subscribers.component'),
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () => import('./subscribers/pages/list-subscribers/list-subscribers.component'),
  //     },
  //     {
  //       path: ':status',
  //       loadComponent: () => import('./subscribers/pages/list-subscribers/list-subscribers.component'),
  //     },
  //     { path: '**', redirectTo: '' },
  //   ]
  // },

  { path: '**', redirectTo: 'setting' },
] as Routes;
