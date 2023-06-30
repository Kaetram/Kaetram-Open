import type { TOptions, TypeOptions } from 'i18next';
import type { Namespaces } from './options';
import type { MaybeArray, UnionToIntersection } from '../types/utils';
import type { Locale } from '.';

type DotValue<T extends string> = T extends `${infer L}.${infer R}`
    ? { [K in L]: DotValue<R> }
    : { [K in T]: string };

type Prefix = TypeOptions['interpolationPrefix'];
type Suffix = TypeOptions['interpolationSuffix'];
type Interpolation<T> = T extends `${string}${Prefix}${infer I}${Suffix}${infer N}`
    ? DotValue<I> & Interpolation<N>
    : unknown;

type TraverseInterpolation<T> = T extends string
    ? Interpolation<T>
    : T extends object
    ? { [K in keyof T]: TraverseInterpolation<T[K]> }
    : never;

type KeySeparator = TypeOptions['keySeparator'];
type FlattenKeys<T> = T extends object
    ? { [K in keyof T]: FlattenKeys<T[K]> } & UnionToIntersection<
          {
              [K in keyof T]: T[K] extends object
                  ? FlattenKeys<
                        {
                            [L in keyof T[K]]: {
                                [M in `${K & string}${KeySeparator}${L & string}`]: FlattenKeys<
                                    T[K][L]
                                >;
                            };
                        }[keyof T[K]]
                    >
                  : T;
          }[keyof T]
      >
    : T;

export type NsInter = {
    [K in keyof Namespaces]: TraverseInterpolation<FlattenKeys<Namespaces[K]>>;
};

type NsSeparator = TypeOptions['nsSeparator'];
export type TFunction = <
    const K extends O extends { ns: infer NS extends keyof NsInter }
        ? keyof NsInter[NS]
        : MaybeArray<
              | keyof NsInter[NS]
              | {
                    [NS in keyof NsInter]: `${NS & string}${NsSeparator}${keyof NsInter[NS] &
                        string}`;
                }[keyof NsInter]
          >,
    const O extends { ns?: NS },
    const KK = K extends readonly (infer KK)[] ? KK : K,
    const NS extends keyof NsInter = KK extends `${infer NS extends keyof NsInter}${NsSeparator}${string}`
        ? NS
        : O extends { ns: infer NS extends keyof NsInter }
        ? NS
        : TypeOptions['defaultNS']
>(
    key: K,
    options?: TOptions<
        O &
            NsInter[NS][(KK extends `${string}${NsSeparator}${infer N}` ? N : KK) &
                keyof NsInter[NS]]
    >
) => string;

export type GetFixedTFunction = <
    const L extends Locale,
    const N extends keyof NsInter,
    const K extends keyof NsInter[NN],
    const NN extends [keyof NsInter[N]] extends [never] ? TypeOptions['defaultNS'] : N,
    const KK extends [keyof NsInter[NN][K]] extends [never] ? NsInter[NN] : NsInter[NN][K]
>(
    lng?: L,
    ns?: N,
    keyPrefix?: K
) => (key: keyof KK, options?: TOptions) => string;
