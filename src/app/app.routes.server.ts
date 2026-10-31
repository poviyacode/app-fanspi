import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // 1. Las rutas privadas o interactivas (Admin, Chats, Pagos) no deberían pre-renderizarse ni indexarse en SEO. 
    // Forzamos RenderMode.Client o RenderMode.Server.
    {
        path: 'chats/**',
        renderMode: RenderMode.Client // Se renderiza en el navegador de forma tradicional
    },
    {
        path: 'admin/**',
        renderMode: RenderMode.Client
    },
    {
        path: 'pay/**',
        renderMode: RenderMode.Client
    },
    {
        path: 'videocall/**',
        renderMode: RenderMode.Client
    },

    // 2. Rutas dinámicas públicas (Posts, Buscar, Tags, etc.) que SÍ quieres que procese el Servidor para SEO:
    {
        path: 'posts/pu/:slug',
        renderMode: RenderMode.Server // SSR dinámico bajo demanda, no requiere getPrerenderParams
    },
    {
        path: 'ads/pu/:slug',
        renderMode: RenderMode.Server
    },
    {
        path: 'search/posts/pu/:slug',
        renderMode: RenderMode.Server
    },
    {
        path: 'tags/**',
        renderMode: RenderMode.Server
    },
    {
        path: 'pu/:slug',
        renderMode: RenderMode.Server
    },
    {
        path: 'live/:slug',
        renderMode: RenderMode.Server
    },
    {
        path: 'test/:slug',
        renderMode: RenderMode.Server
    },

    // 3. Tus comodines de rutas raíz dinámicas (:slug y :slug/pu/:slug)
    {
        path: ':slug',
        renderMode: RenderMode.Server
    },
    {
        path: ':slug/pu/:slug',
        renderMode: RenderMode.Server
    },

    // 4. Cualquier otra ruta por defecto (ej. Inicio, Login, Contacto estáticos) se mantiene en Prerender
    {
        path: '**',
        renderMode: RenderMode.Prerender
    }
];