export type Mods = Record<string, string | boolean | undefined>;

/**
 * Функция для генерации строки классов CSS с учетом текущих классов, модификаций и дополнительных классов.
 *
 * @param currentClassName Основное имя класса, которое всегда будет включено в итоговую строку.
 * @param mods Объект, где ключи — это имена классов, а значения — булевы значения, указывающие, следует ли включать соответствующий класс в итоговую строку.
 * @param additional Массив дополнительных имен классов, которые будут добавлены к итоговой строке, если они определены и не являются `undefined`.
 *
 * @returns Строка, содержащая все переданные классы, разделенные пробелами.
 *
 * @example
 * const result = classNames(styles.button, { styles.buttonActive: isActive, styles.buttonDisabled: isDisabled }, ['extra-class']);
 * // Результат: "button extra-class buttonActive buttonDisabled"
 */
export function classNames(
  currentClassName: string,
  mods: Mods = {},
  additional: Array<string | undefined> = [],
): string {
  return [
    currentClassName,
    ...additional.filter(Boolean),
    ...Object.entries(mods)
      .filter(([_, value]) => Boolean(value))
      .map(([className, _]) => className),
  ].join(" ");
}
