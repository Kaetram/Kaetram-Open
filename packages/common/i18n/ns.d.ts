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
type DefaultNs = TypeOptions['defaultNS'];

export type TFunction = <
    const K extends O extends { ns: infer Ns extends keyof NsInter }
        ? keyof NsInter[Ns]
        : MaybeArray<
              | keyof NsInter[Ns]
              | {
                    [Ns in keyof NsInter]: `${Ns & string}${NsSeparator}${keyof NsInter[Ns] &
                        string}`;
                }[keyof NsInter]
          >,
    const O extends { ns?: Ns },
    const KUnion = K extends readonly (infer KUnion)[] ? KUnion : K,
    const Ns extends keyof NsInter = KUnion extends `${infer Ns extends
        keyof NsInter}${NsSeparator}${string}`
        ? Ns
        : O extends { ns: infer Ns extends keyof NsInter }
        ? Ns
        : DefaultNs
>(
    key: K,
    options?: TOptions<
        O &
            NsInter[Ns][(KUnion extends `${string}${NsSeparator}${infer N}` ? N : KUnion) &
                keyof NsInter[Ns]]
    >
) => string;

export type GetFixedTFunction = <
    const L extends Locale,
    const N extends keyof NsInter,
    const K extends keyof NsInter[Ns],
    const Ns extends [keyof NsInter[N]] extends [never] ? DefaultNs : N,
    const KObject extends [keyof NsInter[Ns][K]] extends [never] ? NsInter[Ns] : NsInter[Ns][K]
>(
    lng: L | undefined,
    ns?: N,
    keyPrefix?: K
) => (key: keyof KObject, options?: TOptions) => string;
