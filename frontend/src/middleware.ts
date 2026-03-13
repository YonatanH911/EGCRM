import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only intercept /api/* requests
    if (request.nextUrl.pathname.startsWith('/api')) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const path = request.nextUrl.pathname.replace(/^\/api/, '');
        const search = request.nextUrl.search;
        const targetUrl = `${backendUrl}${path}${search}`;

        // Clone headers and ensure Authorization is forwarded
        const headers = new Headers(request.headers);

        return NextResponse.rewrite(new URL(targetUrl), {
            request: {
                headers: headers,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
