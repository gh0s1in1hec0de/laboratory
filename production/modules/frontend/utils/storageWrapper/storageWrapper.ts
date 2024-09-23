import { isClient } from "../isClient";

class StorageWrapper {
  private readonly storage?: Storage;

  constructor(type: "local" | "session") {
    try {
      if (!isClient()) throw new Error("Not object \"window\"");

      this.storage = type === "local" ? window.localStorage : window.sessionStorage;
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  get length() {
    if (!this.storage) return;
    return this.storage.length;
  }

  get<T>(key: string) {
    if (!this.storage) return;

    try {
      const value = this.storage.getItem(key);

      if (value === null) return;

      return JSON.parse(value);
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  set(key: string, value: unknown) {
    if (!this.storage) return;

    try {
      const stringValue = JSON.stringify(value);

      this.storage.setItem(key, stringValue);
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  remove(key: string) {
    if (!this.storage) return;

    this.storage.removeItem(key);
  }

  clear() {
    if (!this.storage) return;

    this.storage.clear();
  }

}

export const localStorageWrapper = new StorageWrapper("local");
export const sessionStorageWrapper = new StorageWrapper("session");
