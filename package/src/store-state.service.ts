import { Inject, Injectable, InjectionToken, Optional } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScopePath, StoreLogger } from './interfaces';
import { StoreConfigService } from './store-config.service';
import { deepCompare } from './utils';

export const storeLogger = new InjectionToken('storeLogger');
declare const Immutable: any;

/**
 * Store data, apply changes by decorated actions and get data in an Observable or as an instant value.
 */
@Injectable()
export class StoreStateService {
  /**
   * Dispatch action to store.
   *
   * @param scopePath ScopePath
   * @param reducer
   */
  dispatch = (scopePath: ScopePath, reducer: any) => {
    if (reducer !== null) {
      const scope = scopePath.join('/');
      if (!this.states[scope]) {
        throw new Error(`Scope "${scope}" not found!`);
      }
      let state$ = this.states[scope];
      this.log(`=== DISPATCHING [${scope}] ===`);
      if (Array.isArray(reducer)) {
        this.log('Multi-dispatch');
        let state = state$.value;
        reducer.forEach((step, index) => {
          this.log('Dispatch step', index, step);
          if (step !== null) {
            if (typeof step.reducer === 'function') {
              state = step.reducer(state);
            }
            else {
              throw new Error('Reducer should be a function');
            }
          }
        });
        state$.next(state);
      }
      else {
        this.log('Dispatch', reducer);
        if (typeof reducer.reducer === 'function') {
          state$.next(reducer.reducer(state$.value));
        }
        else {
          throw new Error('Reducer should be a function');
        }
      }
    }
  };

  register = (scopePath: ScopePath, initialState: any) => {
    const scope = scopePath.join('/');
    if (!this.states[scope]) {
      if (this.config.isDebug()) {
        this.log('=== Store Registration ===');
        this.log('Scope:', scopePath);
        this.log('InitialState', initialState);
      }
      this.states[scope] = new BehaviorSubject<any>(Immutable.fromJS(initialState));
      this.states[scope].subscribe((state: any) => {
        this.log(`=== State Updated [${scope}] ===`);
        this.log('State', state.toJS());
      });
    }
  };

  /**
   * Get Observable by selector.
   *
   * @param scopePath ScopePath
   * @param mapper
   * @returns {Observable<T>}
   */
  stream = (scopePath: ScopePath, mapper: any): any => {
    const scope = scopePath.join('/');
    if (!this.states[scope]) {
      throw new Error(`Scope "${scope}" not found!`);
    }
    let state$ = this.states[scope];
    return state$
        .do((state: any) => this.log(`○ Stream side effect`, mapper))
        .map(mapper.mapper)
        .filter((x: any) => typeof x !== 'undefined')
        .distinctUntilChanged(deepCompare)
        .do((state: any) => this.log(`► After distinct side effect`, state))
        .publishReplay(1)
        .refCount();
  };

  /**
   * Get value by selector.
   *
   * @param scopePath ScopePath
   * @param mapper
   * @returns {Array|any}
   */
  value = (scopePath: ScopePath, mapper: any): any => {
    const scope = scopePath.join('/');
    if (!this.states[scope]) {
      throw new Error(`Scope "${scope}" not found!`);
    }
    let state$ = this.states[scope];
    return mapper.mapper(state$.value);
  };

  private logId = 0;

  private state$: BehaviorSubject<any>;

  private states = {};

  constructor(private config: StoreConfigService,
              @Inject(storeLogger) @Optional() private logger: StoreLogger) {
    this.log('=== Store State Initialization ===');
    this.log('Debug:', this.config.isDebug());
    this.log('Cache:', this.config.isCache());
//    this.log('Store initialState', this.initialState);
//    this.log('Store config', {
//      debug: this.config.isDebug(),
//      cache: this.config.isCache(),
//    });
//     crate state subject
//    this.state$ = new BehaviorSubject<any>(Immutable.fromJS(this.initialState));
//     log state updating
//    this.state$.subscribe(state => {
//      this.log('============== STATE UPDATED ==============');
//      this.log('state', state.toJS());
//    });
  }

  /**
   * Log some info to console/logger if logging is enabled.
   *
   * @param message
   * @param params
   */
  private log(message: string | number, ...params: any[]) {
    if (this.config.isDebug()) {
      if (this.logger) {
        this.logger.log(message, this.logId, ...params);
      } else {
        console.log(message, this.logId, ...params);
      }
      this.logId++;
    }
  }
}