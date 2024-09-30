import { CamelCaseKeys } from "./types";

/**
 * Преобразование строки из snake_case в camelCase.
 * @param snake - строка, которую необходимо трансформировать в camelCase.
 * @returns Возвращает строку в camelCase.
 */
export function toCamelCaseString(snake: string): string {
  return snake
    .toLowerCase()
    .split("_")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

/**
 * Функция преобразования данных на основе типа CamelCaseKeys.
 * @param input - данные, в которых ключи необходимо трансформировать в camelCase.
 * @returns Возвращает данные в camelCase.
 */
export function toCamelCase<T>(input: T): CamelCaseKeys<T> {
  if (Array.isArray(input)) {
    return input.map(element => toCamelCase(element)) as unknown as CamelCaseKeys<T>;
  } else if (typeof input === "object" && input !== null) {
    const newObject: any = {};
    Object.keys(input).forEach(key => {
      const camelKey = toCamelCaseString(key);
      newObject[camelKey] = toCamelCase((input as any)[key]);
    });
    return newObject as CamelCaseKeys<T>;
  } else {
    return input as CamelCaseKeys<T>;
  }
}
