import { NgModule, ModuleWithProviders, OpaqueToken, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Store } from "./store";
import { StoreConfig } from './interfaces';
import { StoreConfigService } from './store-config.service';
import { StoreStateService } from './store-state.service';

export const storeScope = new OpaqueToken('storeScope');
export const storeInitialState = new OpaqueToken('storeInitialState');
export const storeConfig = new OpaqueToken('storeConfig');
export const currentScope = new OpaqueToken('currentScope');

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [],
  declarations: [],
})
export class StoreModule {

  // @todo one-time config guard
  static config(config: StoreConfig): ModuleWithProviders {
    return {
      ngModule: StoreModule,
      providers: [
        {provide: storeConfig, useValue: config},
        {
          provide: StoreConfigService,
          useFactory: setupConfig,
          deps: [
            storeConfig,
          ]
        },
        StoreStateService,
      ],
    }
  }

  static provide(scope: string, initialState: any): ModuleWithProviders {
    return {
      ngModule: StoreModule,
      providers: [
        {
          provide: Store,
          useFactory: setupStore,
          deps: [
            storeScope,
            storeInitialState,
            StoreConfigService,
            StoreStateService,
            [Store, new Optional(), new SkipSelf()]
          ]
        },
        {provide: storeScope, useValue: scope},
        {provide: storeInitialState, useValue: initialState},
      ],
    };
  }

}

export function setupConfig(config: StoreConfig) {
  return new StoreConfigService(config);
}

export function setupStore(scope: string,
                           initialState: any,
                           config: StoreConfigService,
                           state: StoreStateService,
                           parent: Store) {
  return new Store(scope, initialState, config, state, parent);
}