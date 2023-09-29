import { defineMiddleware } from 'astro/middleware';

let allowedAdresses = new Set(['127.0.0.1']);

export const onRequest = defineMiddleware((context, next) => {
    if (!allowedAdresses.has(context.clientAddress)) return new Response(null, { status: 403 });

    return next();
});
