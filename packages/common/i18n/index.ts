import * as i18next from 'i18next';
import i18nextBackend from 'i18next-fs-backend';

import type { NsInter } from './ns';

export let locales = { en: 'en-US', ro: 'ro-RO' } as const;
export let defaultLocale = 'en' as const;

export type Locale = keyof typeof locales;

await i18next.use(i18nextBackend).init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    preload: Object.keys(locales),
    ns: ['translation'],
    defaultNS: 'translation',
    backend: { loadPath: '{{lng}}/{{ns}}' }
});

// export let t = i18next.t.bind(i18next) as <
//     const K extends
//         | keyof P[N]
//         | { [N in keyof P]: `${N & string}:${keyof P[N] & string}` }[keyof P],
//     const O extends K extends `${string}:${string}` ? { ns?: never } : { ns?: keyof P },
//     const KNS extends K extends `${string}:${infer NS}` ? NS & keyof P[N] : K,
//     const KK = KNS | readonly KNS[],
//     const P extends { [key: string]: unknown } = NsInter,
//     const N extends keyof P = K extends `${infer N}:${string}`
//         ? N
//         : O extends { ns: infer N }
//         ? N
//         : i18next.TypeOptions['defaultNS']
// >(
//     key: KK,
//     options?: i18next.TOptions<
//         O & (KK extends readonly KNS[] ? P[N][KK[number]] : P[N][KK & keyof P[N]])
//     >
// ) => KK extends readonly K[] ? { [_ in keyof KK]: string } : string;
type MaybeArray<T> = T | readonly T[];
export let t = i18next.t.bind(i18next) as <
    // const K extends MaybeArray<
    //           keyof P[N] | { [N in keyof P]: `${N & string}:${keyof P[N] & string}` }[keyof P]
    //       >,
    const K extends O extends { ns?: infer _ extends keyof P }
        ? keyof P[N]
        : MaybeArray<keyof P[N] | { [N in keyof P]: `${N & string}:${keyof P[N] & string}` }[keyof P]>,
    // const K extends MaybeArray<
    //     | keyof P[N]
    //     | (O extends { ns?: keyof P }
    //           ? never
    //           : { [N in keyof P]: `${N & string}:${keyof P[N] & string}` }[keyof P])
    // >,
    const KP extends K extends readonly (infer KK)[] ? KK : K,
    // const O extends KP extends `${string}:${string}` ? { ns?: never } : { ns?: keyof P },
    const O extends { ns?: keyof P },
    const P extends { [key: string]: unknown } = NsInter,
    const N extends keyof P = KP extends `${infer N}:${string}`
        ? N
        : O extends { ns: infer N }
        ? N
        : i18next.TypeOptions['defaultNS']
>(
    key: K,
    options?: i18next.TOptions<O & P[N][(KP extends `${string}:${infer N}` ? N : KP) & keyof P[N]]>
) => K extends readonly (infer KK)[] ? { [_ in keyof KK]: string } : string;

t('');
// t('store:WARNING_DUPLICATE', { item: 's' });

export let getFixedT = i18next.getFixedT.bind(i18next) as <
    const L extends Locale,
    const N extends keyof NsInter,
    const K extends keyof NsInter[N],
    const LL = L extends Locale ? L : typeof defaultLocale
>(
    lng?: L,
    ns?: N,
    keyPrefix?: K
) => typeof t<keyof NsInter[N][K], K extends readonly (infer KK)[] ? KK : K, { lng?: LL; ns?: never }, NsInter[N], K>;

export let dir = (locale: Locale) => i18next.dir(locale);
