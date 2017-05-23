import { Injectable } from '@angular/core';

import { StoreConfig } from './interfaces';

@Injectable()
export class StoreConfigService {

  constructor(private config: StoreConfig) {
  }

  isDebug(): boolean {
    return this.config.debug;
  }

  isCache(): boolean {
    return this.config.cache;
  }

}