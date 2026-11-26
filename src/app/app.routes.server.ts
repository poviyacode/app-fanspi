import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // 1. Las rutas privadas o interactivas (Admin, Chats, Pagos) no deberían pre-renderizarse ni indexarse en SEO. 
    // Forzamos RenderMode.Client o RenderMode.Server.
    {
        path: 'auth/**',
        renderMode: RenderMode.Client // Se renderiza en el navegador de forma tradicional
    },
    {
        path: 'pay/**',
        renderMode: RenderMode.Client
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

    // 4. Cualquier otra ruta por defecto (ej. Inicio, Login, Contacto estáticos) se mantiene en Prerender
    {
        path: '**',
        renderMode: RenderMode.Prerender
    }
];