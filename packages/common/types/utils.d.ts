export type MaybeArray<T> = T | readonly T[];

export type UnionToIntersection<T> = (T extends unknown ? (_: T) => unknown : never) extends (
    _: infer R
) => unknown
    ? R
    : never;
