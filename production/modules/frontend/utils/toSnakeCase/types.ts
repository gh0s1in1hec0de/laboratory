/**
 * Рекурсивный тип, который преобразует ключи объекта в snake_case
 */
type ToSnakeCase<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Capitalize<Head>
      ? `_${Lowercase<Head>}${ToSnakeCase<Tail>}`
      : `${Head}${ToSnakeCase<Tail>}`
    : S;

export type SnakeCaseKeys<T> = {
  [K in keyof T as ToSnakeCase<string & K>]: T[K] extends object
    ? SnakeCaseKeys<T[K]>
    : T[K];
};
