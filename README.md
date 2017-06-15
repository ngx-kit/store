# Angular Store

Immutable store for Angular 2+ with fancy decorators.

Currently in a deep beta!

## Install

`npm install @ngx-kit/store immutable --save`

## Usage

### Provide immutable

#### Angular-cli

Add this row to `.angular-cli.json`:

```
"scripts": [
  ...
  "../node_modules/immutable/dist/immutable.js",
]
```

### Import Module

Import provides service with scope `app` and initial state `{started: false}`

```typescript
@NgModule({
  imports: [
    ...
    StoreModule.provide('app', {started: false}),
  ],
  ...
```

## Create Actions

TBD

### Actions Decorators

* `SetProp(keyPath: string[])`
* `UpdateProp(keyPath: string[])`
* `SetCollectionItem(keyPath: string[], indexKey = 'id')`
* `UpdateCollectionItem(keyPath: string[], indexKey = 'id')`
* `DeleteCollectionItem(keyPath: string[], indexKey = 'id')`
* `UpdateCollection(keyPath: string[], indexKey = 'id')`

## Create Selectors

TDB

### Selectors Decorators

* `SelectProp(keyPath: string[])`
* `SelectPropCombined(keyPaths: string[][], indexKey = 'id')`
* `SelectCollectionKeys(keyPath: string[], indexKey = 'id')`
* `SelectCollectionItem(keyPath: string[], indexKey = 'id')`

## Dispatch

```typescript
constructor(private store: Store) {
}
...
someMethod(value) {
  this.store.dispatch(ActionsClass.setValue(value));
}
```

## Get Stream

```typescript
constructor(private store: Store) {
}
...
someMethod() {
  this.store.stream(SelectorsClass.value()).subsribe(value => {
  });
}
```

## Get Value

```typescript
constructor(private store: Store) {
}
...
someMethod() {
  const value = this.store.value(SelectorsClass.value();
}
```

## Examples

### Actions

```typescript
...

export class AuthActions {

  @SetProp(['account'])
  static setAccount(account: CompanyAccountModel) {
    return account;
  }

  @SetProp(['isAuth'])
  static setIsAuth(isAuth: boolean) {
    return isAuth;
  }

  @SetProp(['account', 'live'])
  static setLive(live: boolean) {
    return live;
  }
  
  @UpdateCollectionItem(['clients'])
  static assignClient(changes: {id: number, assignedTo: number}) {
    return (client) => {
      // Here you gets client model from store and should return updated value.
      // immutable will be provided by Immutable.js
      return Object.assign(client, {assignedTo: changes.assignedTo, archived: false});
    };
  }
  
  ...
}
```

### Selectors

```typescript
...
export class AuthSelectors {

  @SelectProp(['isAuth'])
  static isAuth() {
  }

  @SelectProp(['account', 'live'])
  static live() {
  }

  @SelectProp(['account'])
  static account() {
  }

  @SelectProp(['account', 'owner'])
  static isOwner() {
  }
  
  @SelectProp(['clients'])
  static archivedClients() {
    return (clients: ClientModel[]) => {
      return clients.filter(client => client.archived && !client.blocked);
    }
  }

  @SelectPropCombined([
    ['clients'],
    ['messages'],
  ])
  static clientWithMessages(clientId: number) {
    return (data) => {
      let [clients, messages] = data;
      return {
        client: clients.find(x => x.id == clientId),
        messages: messages.filter(x => x.clientId == clientId),
      }
    };
  }

  @SelectCollectionItem(['clients'])
  static client(id: number) {
  }

  @SelectCollectionItem(['tmpMessages'], 'clientId')
  static tmpMessage(clientId: number) {
    return (tmpMessage: TmpMessageModel) => {
      return tmpMessage ? tmpMessage.text : '';
    };
  }
}
```
