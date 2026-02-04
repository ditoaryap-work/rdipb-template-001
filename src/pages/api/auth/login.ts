import type { APIRoute } from 'astro';
import { serialize } from 'cookie';
import { getAdminSettings } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, password } = body;

        const clientId = import.meta.env.PUBLIC_CLIENT_ID || 'template-001';

        // 1. Try to get credentials from Supabase first (Persistence for Vercel)
        let adminEmail = import.meta.env.ADMIN_EMAIL;
        let adminPassword = import.meta.env.ADMIN_PASSWORD;

        const dbSettings = await getAdminSettings(clientId);

        if (dbSettings) {
            adminEmail = dbSettings.email;
            adminPassword = dbSettings.password_hash; // We use the term hash but currently storing plain text for simplicity as per previous setup, can be enhanced with bcrypt later
        }

        // Security: Reject if env not configured and no DB record
        if (!adminEmail || !adminPassword) {
            console.error('[Login Error] ADMIN_EMAIL or ADMIN_PASSWORD not set and no DB record found!');
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate credentials
        if (email === adminEmail && password === adminPassword) {
            // Set HttpOnly session cookie
            const cookie = serialize('admin_session', 'authenticated', {
                httpOnly: true,
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
                sameSite: 'lax'
            });

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'Set-Cookie': cookie,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (e) {
        console.error('[Login Exception]', e);
        return new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
