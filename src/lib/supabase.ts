import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Track page view
export async function trackPageView(path: string, clientId: string) {
    try {
        await supabase.from('page_views').insert({
            site_id: clientId,
            path: path,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to track page view:', error);
    }
}

// Get analytics data
export async function getAnalytics(clientId: string) {
    try {
        // Total views
        const { count: totalViews } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', clientId);

        // Views today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayViews } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', clientId)
            .gte('timestamp', today.toISOString());

        return {
            totalViews: totalViews || 0,
            todayViews: todayViews || 0
        };
    } catch (error) {
        console.error('Failed to get analytics:', error);
        return { totalViews: 0, todayViews: 0 };
    }
}

// Get admin settings
export async function getAdminSettings(clientId: string) {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .eq('site_id', clientId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        return null;
    }
}

// Update admin settings
export async function updateAdminSettings(clientId: string, email: string, passwordHash: string) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                site_id: clientId,
                email,
                password_hash: passwordHash,
                updated_at: new Date().toISOString()
            }, { onConflict: 'site_id' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Failed to update admin settings:', error);
        return { success: false, error: error };
    }
}
