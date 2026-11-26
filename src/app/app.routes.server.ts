import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Ruta raíz
    {
        path: '',
        renderMode: RenderMode.Client,
    },
    {
        path: 'home',
        renderMode: RenderMode.Client,
    },
    {
        path: 'auth',
        renderMode: RenderMode.Client,
    },
    {
        path: 'auth/**',
        renderMode: RenderMode.Client,
    },
    {
        path: 'agency/**',
        renderMode: RenderMode.Client,
    },
    {
        path: 'pagos',
        renderMode: RenderMode.Client,
    },
    {
        path: 'pay',
        renderMode: RenderMode.Client,
    },
    {
        path: 'pay/**',
        renderMode: RenderMode.Client,
    },

    // Rutas dinámicas con parámetro
    {
        path: 'test/:code_collection',
        renderMode: RenderMode.Server,
    },

    // Perfil dinámico en raíz (:slug)
    {
        path: ':slug',
        renderMode: RenderMode.Server,
    },

    // Fallback comodín
    {
        path: '**',
        renderMode: RenderMode.Client,
    },
];