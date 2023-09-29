import { ns, resources, defaultLocale, type Locale } from './options';

import i18next from 'i18next';

import type { GetFixedTFunction, TFunction } from './ns';

await i18next.init({ ns, resources, lng: defaultLocale, fallbackLng: defaultLocale });

export let getLanguage = () => i18next.language as Locale;
export let dir = (lng: Locale) => i18next.dir(lng);
export let changeLanguage = (lng?: Locale) => i18next.changeLanguage(lng);
export let t = i18next.t.bind(i18next) as TFunction;
export let getFixedT = i18next.getFixedT.bind(i18next) as GetFixedTFunction;

export * from './options';
