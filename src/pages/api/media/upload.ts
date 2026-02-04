
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }

        const clientId = import.meta.env.PUBLIC_CLIENT_ID || 'template-001';

        // Validation: Check File Type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Invalid file type. Only JPG, PNG, WEBP, SVG allowed.' }), { status: 400 });
        }

        // Validation: Check File Size (Max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return new Response(JSON.stringify({ error: 'File too large. Max 2MB.' }), { status: 400 });
        }

        // Generate Path: [site-id]/[timestamp]-[safe-name]
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const filePath = `${clientId}/${timestamp}-${safeName}`;

        // Convert File to ArrayBuffer for Supabase Upload
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, fileData, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return new Response(JSON.stringify({
            success: true,
            url: publicUrl,
            message: 'Upload successful'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Server upload failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
