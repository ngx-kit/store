export interface StoreConfig {
  cache: boolean;
  debug: boolean;
}

export type ScopePath = string[];

export interface StoreLogger {
  log(message?: any, ...optionalParams: any[]): void;
}