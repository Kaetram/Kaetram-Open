import { ns, defaultNS, resources } from './options';

import i18next from 'i18next';

import type { GetFixedTFunction, TFunction } from './ns';

export let locales = {
    de: 'de-DE',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    ro: 'ro-RO',
    ru: 'ru-RU'
} as const;
export let defaultLocale = 'en' as const;

export type Locale = keyof typeof locales;

await i18next.init({
    ns,
    defaultNS,
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    preload: Object.keys(locales)
});

export let lang = i18next.language as Locale;

export let t = i18next.t.bind(i18next) as TFunction;
export let getFixedT = i18next.getFixedT.bind(i18next) as GetFixedTFunction;
export let dir = (lng: Locale) => i18next.dir(lng);
export let changeLanguage = (lng?: Locale) => i18next.changeLanguage(lng);
