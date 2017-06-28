import { Injectable } from '@angular/core';
import { StoreConfig } from './interfaces';

@Injectable()
export class StoreConfigService {
  constructor(private config: StoreConfig) {
  }

  isCache(): boolean {
    return this.config.cache;
  }

  isDebug(): boolean {
    return this.config.debug;
  }
}