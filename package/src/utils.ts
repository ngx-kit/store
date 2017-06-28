declare const Immutable: any;
// Store
/**
 * Deep compare of two objects.
 * // @todo can we compare state in immutable.js state?
 *
 * @param leftChain
 * @param rightChain
 * @returns {boolean}
 */
export function deepCompare(leftChain: any, rightChain: any) {
  let i, l;
  const compare2Objects = (x: any, y: any) => {
    let p;
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }
    if (x === y) {
      return true;
    }
    if ((typeof x === 'function' && typeof y === 'function') ||
        (x instanceof Date && y instanceof Date) ||
        (x instanceof RegExp && y instanceof RegExp) ||
        (x instanceof String && y instanceof String) ||
        (x instanceof Number && y instanceof Number)) {
      return x.toString() === y.toString();
    }
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }
    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }
    if (x.constructor !== y.constructor) {
      return false;
    }
    if (x.prototype !== y.prototype) {
      return false;
    }
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }
    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
      switch (typeof (x[p])) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);
          if (!compare2Objects(x[p], y[p])) {
            return false;
          }
          leftChain.pop();
          rightChain.pop();
          break;
        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }
    return true;
  };
  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }
  for (i = 1, l = arguments.length; i < l; i++) {
    leftChain = []; //Todo: this can be cached
    rightChain = [];
    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }
  return true;
}
// Decorators
/**
 * Call function with passing state or just return value of mapper.
 *
 * @param original
 * @param props
 * @param state
 * @param keyPath
 * @returns {any}
 */
export function originalMapperWrapper(original: any, props: any[], state?: any, keyPath?: any) {
  const originalMapper = original.apply(this, props);
  if (typeof originalMapper === 'function') {
    if (state) {
      let localState = state.getIn(keyPath);
      if (Immutable.Iterable.isIterable(localState)) {
        localState = localState.toJS();
      }
      return originalMapper(localState);
    } else {
      return originalMapper();
    }
  } else {
    return originalMapper;
  }
}
/**
 * Merge or set Immutable.js objects into state.
 *
 * @param state
 * @param keyPath
 * @param value
 * @returns {any}
 */
export function stateMergeOrSet(state: any, keyPath: any, value: any) {
  if (state.getIn(keyPath)) {
    return state.mergeDeepIn(keyPath, Immutable.fromJS(value));
  } else {
    return state.setIn(keyPath, Immutable.fromJS(value));
  }
}