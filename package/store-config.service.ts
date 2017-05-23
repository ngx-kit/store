import { Injectable } from '@angular/core';

import { StoreConfig } from './interfaces';

@Injectable()
export class StoreConfigService {

  constructor(private config: StoreConfig) {
    if (this.isDebug()) {
      console.log('=== Store Config Initialization ===');
      console.log('Debug:', this.isDebug());
      console.log('Cache:', this.isCache());
    }
  }

  isDebug(): boolean {
    return this.config.debug;
  }

  isCache(): boolean {
    return this.config.cache;
  }

}