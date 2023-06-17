import * as i18next from 'i18next';
import i18nextBackend from 'i18next-fs-backend';

import type { NsInter } from './ns';

export let locales = { en: 'en-US', ro: 'ro-RO' };
export let defaultLocale = 'en';

export type Locale = keyof typeof locales;

await i18next.use(i18nextBackend).init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    preload: Object.keys(locales),
    ns: ['translation'],
    defaultNS: 'translation',
    backend: { loadPath: '{{lng}}/{{ns}}' }
});

export let t = <
    K extends keyof NsInter[N],
    O extends { ns?: keyof NsInter },
    N extends keyof NsInter = O extends { ns: infer N } ? N : 'translation'
>(
    key: K,
    options?: i18next.TOptions<O & NsInter[N][K]>
) => i18next.t(key as string, options);

export let dir = (locale: Locale) => i18next.dir(locale);
