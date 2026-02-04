
import type { APIRoute } from 'astro';
import { serialize } from 'cookie';

export const POST: APIRoute = async () => {
    // Clear cookie by setting expiry to past
    const cookie = serialize('admin_session', '', {
        httpOnly: true,
        secure: import.meta.env.PROD,
        maxAge: -1,
        path: '/',
    });

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Set-Cookie': cookie,
            'Content-Type': 'application/json',
            'Location': '/login' // Hint for client
        }
    });
}
