import { defineMiddleware } from 'astro:middleware';
import { parse } from 'cookie';
import { trackPageView } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ locals, request, redirect }, next) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Protect /admin routes
    if (path.startsWith('/admin')) {
        const cookieHeader = request.headers.get('cookie') || '';
        const cookies = parse(cookieHeader);

        if (!cookies['admin_session'] || cookies['admin_session'] !== 'authenticated') {
            return redirect('/login');
        }
    }

    // Track page views for public pages (not admin, api, or static assets)
    const isPublicPage = !path.startsWith('/admin') &&
        !path.startsWith('/api') &&
        !path.startsWith('/login') &&
        !path.startsWith('/_') &&
        !path.includes('.');

    if (isPublicPage) {
        const clientId = import.meta.env.PUBLIC_CLIENT_ID || 'default';
        // Fire and forget - don't await to avoid blocking
        trackPageView(path, clientId).catch(() => { });
    }

    return next();
});
