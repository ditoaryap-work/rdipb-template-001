import { createClient } from '@supabase/supabase-js';
import { siteConfig } from '../config/site.config';

// Environment variables
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.warn('Analytics: Failed to initialize Supabase client', e);
    }
} else {
    console.warn('Analytics: Missing Setup. Check .env');
}

export const trackPageView = async () => {
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('page_views')
            .insert({
                client_id: siteConfig.clientId,
                path: window.location.pathname, // Ignore hash/query for basic tracking
                source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
                device: window.innerWidth < 768 ? 'mobile' : 'desktop'
            });

        if (error) console.error('Analytics: Track View Error', error);
    } catch (e) {
        console.error('Analytics: Track View Error', e);
    }
};

export const trackEvent = async (name: string, details: string = '') => {
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('events')
            .insert({
                client_id: siteConfig.clientId,
                name,
                details
            });

        if (error) console.error('Analytics: Track Event Error', error);
    } catch (e) {
        console.error('Analytics: Track Event Error', e);
    }
};

export const getVisitorCount = async (): Promise<number | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.rpc('get_visit_count', {
            client_text: siteConfig.clientId
        });
        if (error) throw error;
        return data as number;
    } catch (e) {
        console.error('Analytics: Get Count Error', e);
        return null;
    }
};
