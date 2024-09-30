import { SnakeCaseKeys } from "./types";

/**
 * Преобразование строки из camelCase в snake_case.
 * @param camel - строка, которую необходимо трансформировать в snake_case.
 * @returns Возвращает строку в snake_case.
 */
export function toSnakeCaseString(camel: string): string {
  return camel.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Функция преобразования данных на основе типа SnakeCaseKeys.
 * @param input - данные, в которых ключи необходимо трансформировать в snake_case.
 * @returns Возвращает данные в snake_case.
 */
export function toSnakeCase<T>(input: T): SnakeCaseKeys<T> {
  if (Array.isArray(input)) {
    return input.map((element) => toSnakeCase(element)) as unknown as SnakeCaseKeys<T>;
  } else if (typeof input === "object" && input !== null) {
    const newObject: any = {};
    Object.keys(input).forEach((key) => {
      const snakeKey = toSnakeCaseString(key);
      newObject[snakeKey] = toSnakeCase((input as any)[key]);
    });
    return newObject as SnakeCaseKeys<T>;
  } else {
    return input as SnakeCaseKeys<T>;
  }
}
