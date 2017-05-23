export interface StoreConfig {
  debug: boolean;
  cache: boolean;
}

export type ScopePath = string[];

export interface StoreLogger {
  log(message?: any, ...optionalParams: any[]): void;
}