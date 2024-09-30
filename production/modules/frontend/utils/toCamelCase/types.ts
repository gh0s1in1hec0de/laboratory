/**
 * Рекурсивный тип, который преобразует ключи объекта в camelCase
 */
type ToCamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<ToCamelCase<Tail>>}`
    : S;

export type CamelCaseKeys<T> = {
  [K in keyof T as ToCamelCase<string & K>]: T[K] extends object
    ? CamelCaseKeys<T[K]>
    : T[K];
};
