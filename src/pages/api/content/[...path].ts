
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ... (existing helper resolveContentPath) ...
const resolveContentPath = (paramsPath: string | undefined): string | null => {
    if (!paramsPath) return null;
    const safePath = paramsPath.replace(/\.\./g, '');
    const contentDir = path.join(process.cwd(), 'content');
    const fullPath = path.join(contentDir, `${safePath}.yaml`);
    if (!fullPath.startsWith(contentDir)) return null;
    return fullPath;
};

export const GET: APIRoute = async ({ params }) => {
    // ... (existing code) ...
    try {
        const filePath = resolveContentPath(params.path);
        if (!filePath || !fs.existsSync(filePath)) {
            return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = yaml.load(fileContent);
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, params }) => {
    // ... (existing code, ensure it's robust) ...
    try {
        const filePath = resolveContentPath(params.path);
        if (!filePath) return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400 });

        const body = await request.json();
        const yamlContent = yaml.dump(body);

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, yamlContent, 'utf-8');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const filePath = resolveContentPath(params.path);
        if (!filePath || !fs.existsSync(filePath)) {
            return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
        }

        fs.unlinkSync(filePath);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Failed to delete' }), { status: 500 });
    }
};
