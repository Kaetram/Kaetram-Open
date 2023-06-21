import TranslationEn from './en/translation';
import StoreEn from './en/store';
import TranslationRo from './ro/translation';
import StoreRo from './ro/store';

export let resources = {
    en: { translation: TranslationEn, store: StoreEn },
    ro: { translation: TranslationRo, store: StoreRo }
} as const;

export let ns = Object.keys(resources.en);
export let defaultNS = 'translation' as const;

export type Namespaces = typeof resources.en;

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS;
        returnNull: false;
        returnObjects: false;
    }
}
