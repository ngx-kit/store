import { originalMapperWrapper, stateMergeOrSet } from './utils';

declare const Immutable: any;

// @todo log via logger

/**
 * Get property from store by path.
 *
 * @param keyPath
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SelectProp(keyPath: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      let originalMapper = original.apply(this, props);
      return {
        selector: 'SelectProp',
        selectorProps: [keyPath],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        mapper: (state) => {
          let mapped = state.getIn(keyPath);
          if (Immutable.Iterable.isIterable(mapped)) {
            mapped = mapped.toJS();
          }
          return originalMapper
              ? originalMapper(mapped)
              : mapped;
        }
      }
    };
    return descriptor;
  };
}

/**
 * Get few properties by different paths in one selection.
 *
 * @param keyPaths
 * @param indexKey
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SelectPropCombined(keyPaths: string[][], indexKey = 'id') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      let originalMapper = original.apply(this, props);
      return {
        selector: 'SelectPropCombined',
        selectorProps: [keyPaths, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        mapper: (state) => {
          let mapped = [];
          keyPaths.forEach(keyPath => {
            let mappedEntry = state.getIn(keyPath);
            if (Immutable.Iterable.isIterable(mappedEntry)) {
              mappedEntry = mappedEntry.toJS();
            }
            mapped.push(mappedEntry);
          });
          return originalMapper
              ? originalMapper(mapped)
              : mapped;
        }
      }
    };
    return descriptor;
  };
}

/**
 * Select indexKey values from collection items.
 *
 * @param keyPath
 * @param indexKey
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SelectCollectionKeys(keyPath: string[], indexKey = 'id') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      let originalMapper = original.apply(this, props);
      return {
        selector: 'SelectCollectionKeys',
        selectorProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        mapper: (state) => {
          const collection = state.getIn(keyPath);
          const keys = Immutable.Iterable.isIterable(collection)
              ? collection.map(_ => _.get(indexKey)).toJS()
              : [];
          return originalMapper
              ? originalMapper(keys)
              : keys;
        }
      }
    };
    return descriptor;
  };
}

/**
 * Select item from collection by indexKey value.
 *
 * @param keyPath
 * @param indexKey
 * @param strict - existent of item in collection
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SelectCollectionItem(keyPath: string[], indexKey = 'id', strict = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      let originalMapper = original.apply(this, props);
      return {
        selector: 'SelectCollectionItem',
        selectorProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        mapper: (state) => {
          if (typeof props[0] === 'undefined') {
            throw new Error(`You should pass ${indexKey} by first param in selector`);
          }
          const item = state.getIn(keyPath).find(x => x.get(indexKey) === props[0]);
          const jsItem = Immutable.Iterable.isIterable(item)
              ? item.toJS()
              : null;
          if (!jsItem && strict) {
            console.error('Collection Item not found', state.getIn(keyPath).toJS(), props[0]);
            throw new Error('Collection Item not found');
          }
          return originalMapper
              ? originalMapper(jsItem)
              : jsItem;
        }
      }
    };
    return descriptor;
  };
}

/**
 * Set (override if exists) property.
 *
 * @param keyPath
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SetProp(keyPath: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      return {
        setter: 'SetProp',
        setterProps: [keyPath],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        reducer: (state) => {
          const value = originalMapperWrapper(original, props, state, keyPath);
          return state.setIn(keyPath, Immutable.fromJS(value));
        },
      }
    };
    return descriptor;
  };
}

/**
 * Update (set or merge) property.
 *
 * @param keyPath
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function UpdateProp(keyPath: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      return {
        setter: 'MergeObject',
        setterProps: [keyPath],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        reducer: (state) => {
          const value = originalMapperWrapper(original, props, state, keyPath);
          return stateMergeOrSet(state, keyPath, value);
        },
      }
    };
    return descriptor;
  };
}

/**
 * Set (override if exists) item in array.
 *
 * @param keyPath
 * @param indexKey
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function SetCollectionItem(keyPath: string[], indexKey = 'id') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (prop) => {
      return {
        setter: 'SetCollectionItem',
        setterProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: prop,
        reducer: (state) => {
          const collection = state.getIn(keyPath);
          const index = collection.findIndex(x => x.get(indexKey) == prop[indexKey]);
          if (index !== -1) {
            const item = originalMapperWrapper(original, [prop], state, [...keyPath, index]);
            return state.setIn([...keyPath, index], Immutable.fromJS(item));
          }
          else {
            const item = originalMapperWrapper(original, [prop]);
            return state.setIn(keyPath, collection.push(Immutable.fromJS(item)));
          }
        },
      }
    };
    return descriptor;
  };
}

/**
 * Update (set or merge) item in array.
 *
 * @param keyPath
 * @param indexKey
 * @param strict - existent of item in collection
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function UpdateCollectionItem(keyPath: string[], indexKey = 'id', strict = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (prop) => {
      return {
        setter: 'UpdateCollectionItem',
        setterProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: prop,
        reducer: (state) => {
          if (prop[indexKey] === undefined) {
            console.error('prop[indexKey] is undefined');
            console.error('prop', prop);
            console.error('indexKey', indexKey);
          }
          const collection = state.getIn(keyPath);
          const index = collection.findIndex(x => x.get(indexKey) == prop[indexKey]);
          if (index !== -1) {
            const item = originalMapperWrapper(original, [prop], state, [...keyPath, index]);
            return stateMergeOrSet(state, [...keyPath, index], item);
          } else if (strict) {
            console.error('Collection item not found', prop[indexKey], collection);
            throw new Error('Collection item not found');
          } else {
            return state;
          }
        },
      }
    };
    return descriptor;
  };
}

/**
 * Remove item from array.
 *
 * @param keyPath
 * @param indexKey
 * @param strict - existent of item in collection
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function DeleteCollectionItem(keyPath: string[], indexKey = 'id', strict = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (prop) => {
      return {
        setter: 'DeleteCollectionItem',
        setterProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: prop,
        reducer: (state) => {
          if (prop[indexKey] === undefined) {
            console.error('prop[indexKey] is undefined');
            console.error('prop', prop);
            console.error('indexKey', indexKey);
          }
          const collection = state.getIn(keyPath);
          const item = originalMapperWrapper(original, [prop], collection, keyPath);
          const index = collection.findIndex(x => x.get(indexKey) == item[indexKey]);
          if (index !== -1) {
            return state.deleteIn([...keyPath, index]);
          } else if (strict) {
            console.error(`Item for deleting not found`, item);
            throw new Error(`Item for deleting not found`);
          } else {
            return state;
          }
        },
      }
    };
    return descriptor;
  };
}

/**
 * Set (override existed items) or push new items to array.
 *
 * @param keyPath
 * @param indexKey
 * @returns {(target:any, propertyKey:string, descriptor:PropertyDescriptor)=>PropertyDescriptor}
 * @constructor
 */
export function UpdateCollection(keyPath: string[], indexKey = 'id') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let original = descriptor.value;
    descriptor.value = (...props) => {
      return {
        setter: 'UpdateCollection',
        setterProps: [keyPath, indexKey],
        caller: `${target.constructor.name}.${propertyKey}`,
        callerProps: props,
        reducer: (state) => {
          const collection = state.getIn(keyPath);
          // @todo check wrapper passed collection
          const updates = originalMapperWrapper(original, props, collection, keyPath);
          let result = collection;
          updates.forEach(update => {
            let index = collection.findIndex(x => x.get(indexKey) == update[indexKey]);
            result = index !== -1
                ? result.set(index, Immutable.fromJS(update))
                : result.push(Immutable.fromJS(update));
          });
          return state.setIn(keyPath, result);
        },
      }
    };
    return descriptor;
  };
}