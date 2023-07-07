import { sequence } from 'astro/middleware';
import { i18nMiddleware } from 'astro-i18n-aut';

const i18n = i18nMiddleware({ defaultLocale: 'en' });

export const onRequest = sequence(i18n);
