import { defineMiddleware, sequence } from 'astro/middleware';
import { i18nMiddleware, getLocale } from 'astro-i18n-aut';
import { defaultLocale, changeLanguage, type Locale } from '@kaetram/common/i18n';

let language = defineMiddleware(async ({ url }, next) => {
    let lang = getLocale(url) as Locale;
    await changeLanguage(lang || defaultLocale);

    return await next();
});

export let onRequest = sequence(i18nMiddleware, language);
