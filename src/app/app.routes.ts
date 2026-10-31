import { Routes } from '@angular/router';
import { NoAuthGuard } from '@guards/no-auth.guard';
import { AuthGuard } from '@guards/auth.guard';

export const routes: Routes = [
    {
        path: 'public',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./layout/auth/auth.routes'),
    },
    {
        path: '',
        loadComponent: () => import('./layout/home/home.component')
    },
    {
        path: 'test/:code_collection',
        loadComponent: () => import('./layout/test/a/a.component')
    },
    {
        path: 'pay',
        children: [
            {
                path: 'checkout/:code_collection',
                //loadComponent: () => import('./layout/pay/pages/personal-information-pay/personal-information-pay.component')
                //loadComponent: () => import('./layout/pay/pages/v2/checkout-pay/checkout-pay.component');
                // loadComponent: () => import('./layout/pay/pages/stripe-inc-pay/stripe-inc-pay.component')
                loadComponent: () => import('./layout/pay/pages/main-pay/main-pay.component')
                //loadComponent: () => import('./layout/test/a/a.component')
            },
            {
                path: 'personal/:code_collection',
                loadComponent: () => import('./layout/pay/pages/personal-pay/personal-pay.component')
            },
            {
                path: 'stripe_inc/:code_collection',
                loadComponent: () => import('./layout/pay/pages/stripe-inc-pay/stripe-inc-pay.component')
            },
            {
                path: 'stripe_llc/:code_collection',
                loadComponent: () => import('./layout/pay/pages/stripe-llc-pay/stripe-llc-pay.component')
            },
            {
                path: 'cybersource/:code_collection',
                loadComponent: () => import('./layout/pay/pages/cybersource-pay/cybersource-pay.component')
            },
            {
                path: 'checkout3/:code_collection',
                loadComponent: () => import('./layout/pay/pages/v3/checkout-pay/checkout-pay.component')
            },
            {
                path: 'checkout4/:code_collection',
                loadComponent: () => import('./layout/pay/pages/v4/checkout-pay/checkout-pay.component')
            },
            {
                path: 'notification/:code_collection',
                loadComponent: () => import('./layout/pay/pages/notification-pay/notification-pay.component'),
            },
        ],
    },
    {
        path: ':slug',
        loadComponent: () => import('./layout/profile/pages/main-profile/main-profile.component')
    },
    {
        path: '**',
        loadComponent: () => import('./shared/not-found/not-found.component')
    },
];
