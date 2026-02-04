import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getAdminSettings, updateAdminSettings } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { currentPassword, newPassword } = await request.json();
        const clientId = import.meta.env.PUBLIC_CLIENT_ID || 'template-001';

        // 1. Get current credentials (from DB or Env)
        let adminEmail = import.meta.env.ADMIN_EMAIL;
        let adminPassword = import.meta.env.ADMIN_PASSWORD;

        const dbSettings = await getAdminSettings(clientId);
        if (dbSettings) {
            adminEmail = dbSettings.email;
            adminPassword = dbSettings.password_hash;
        }

        // Verify current password
        if (currentPassword !== adminPassword) {
            return new Response(JSON.stringify({ error: 'Password saat ini salah' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return new Response(JSON.stringify({ error: 'Password baru minimal 6 karakter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Persist to Supabase (Works on Vercel)
        const dbResult = await updateAdminSettings(clientId, adminEmail, newPassword);

        if (!dbResult.success) {
            // If DB fail (maybe table not created yet), attempt local .env update as fallback
            try {
                const envPath = path.join(process.cwd(), '.env');
                if (fs.existsSync(envPath)) {
                    let envContent = fs.readFileSync(envPath, 'utf-8');
                    envContent = envContent.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${newPassword}`);
                    fs.writeFileSync(envPath, envContent);
                }
            } catch (e) {
                console.error('Failed to update .env fallback:', e);
            }
        }

        return new Response(JSON.stringify({ success: true, persisted: dbResult.success }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('[Change Password Error]', e);
        return new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
