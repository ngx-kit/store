import { Injectable } from '@angular/core';

import { ScopePath } from './interfaces';
import { StoreConfigService } from './store-config.service';
import { StoreStateService } from './store-state.service';

@Injectable()
export class Store {

  constructor(private scope: string,
              private initialState: any,
              private config: StoreConfigService,
              private state: StoreStateService,
              public parent: Store) {
    // reg in global store
    this.state.register(this.getScopePath(), this.initialState);
  }

  dispatch = (reducer: any) => {
    if (reducer !== null) {
      this.state.dispatch(this.getScopePath(), reducer);
    }
  };

  getScope(): string {
    return this.scope;
  }

  getScopePath(): ScopePath {
    let path: string[] = [];
    let parent = this.parent;
    while (parent) {
      path.push(parent.getScope());
      parent = parent.parent;
    }
    path.push(this.scope);
    return path;
  }

  stream = (mapper: any): any => {
    return this.state.stream(this.getScopePath(), mapper);
  };

  value = (mapper: any): any => {
    return this.state.value(this.getScopePath(), mapper);
  };

}