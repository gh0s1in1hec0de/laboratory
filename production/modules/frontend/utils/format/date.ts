import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

export enum FormatDate {
  DAY_MONTH_YEAR = "dd.MM.yyyy",
  DAY_MONTH_YEAR_TIME = "dd.MM.yyyy HH:mm",
  DAY_MONTH_YEAR_FULL_TIME = "dd.MM.yyyy HH:mm:ss",
  YEAR_MONTH = "yyyy-MM",
  YEAR_MONTH_DAY = "yyyy-MM-dd",
  YEAR_MONTH_DAY_TIME = "yyyy-MM-dd HH:mm",
  YEAR = "yyyy",
  TIME = "HH:mm",
  WEEKDAY = "eeee",
  COUNTER = "HH:mm:ss",
  MONTH_YEAR = "MM.yyyy",
}

export const formatDateToDateFullTime = (date: Date): string => format(date, FormatDate.DAY_MONTH_YEAR_FULL_TIME);

export const formatDateToDateTime = (date: Date): string => format(date, FormatDate.DAY_MONTH_YEAR_TIME);

export const formatDateToDayMonthYear = (date?: Date) => (date ? format(date, FormatDate.DAY_MONTH_YEAR) : "");

export const formatDateToWeekday = (date: Date) => format(date, FormatDate.WEEKDAY, { locale: ru });

export const formatDateToMonthYear = (date?: Date) => (date ? format(date, FormatDate.MONTH_YEAR, { locale: ru }) : "");

export const formatDateToYearMonth = (date: Date) => format(date, FormatDate.YEAR_MONTH, { locale: ru });

export const formatDateToYearMonthDayTime = (date: Date) => format(date, FormatDate.YEAR_MONTH_DAY_TIME, { locale: ru });
