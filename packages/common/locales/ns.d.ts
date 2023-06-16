import type Translation from './en/translation';
import type Store from './en/store';
import type { TypeOptions } from 'i18next';

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

type UnionToIntersection<T> = (T extends unknown ? (_: T) => unknown : never) extends (
    _: infer R
) => unknown
    ? R
    : never;

type DotFlatten<T> = T extends object
    ? UnionToIntersection<
          {
              [K in keyof T]: T[K] extends object
                  ? DotFlatten<
                        {
                            [L in keyof T[K]]: {
                                [M in `${K & string}.${L & string}`]: DotFlatten<T[K][L]>;
                            };
                        }[keyof T[K]]
                    >
                  : T;
          }[keyof T]
      >
    : T;

export interface Namespace {
    translation: typeof Translation;
    store: typeof Store;
}

export type NsInter = {
    [K in keyof Namespace]: TraverseInterpolation<DotFlatten<Namespace[K]>>;
};

export type { TOptions } from 'i18next';
