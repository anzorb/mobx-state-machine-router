[![CircleCI](https://circleci.com/gh/interestingChoice/mobx-state-machine-router.svg?style=svg)](https://circleci.com/gh/interestingChoice/mobx-state-machine-router)

[![codecov](https://codecov.io/gh/interestingChoice/mobx-state-machine-router/branch/master/graph/badge.svg)](https://codecov.io/gh/interestingChoice/mobx-state-machine-router)

### Installation

```js
npm install mobx-state-machine-router
```

or

```js
yarn add mobx-state-machine-router
```

### Basics

State machine routing using actions, with optional URL persistence capabilities with Mobx

```js
const states = {
    'HOME': {
        actions: {
            goToWork: 'WORK'
        }
    },
    'WORK': {
        actions: {
            goHome: 'HOME'
        }
    }
};

stateMachineRouter.emit('goToWork');

console.log(stateMachineRouter.currentState.name);
> 'WORK'
```

### Passing Params

All params are passed as mobx observables, allowing to `observe` and `intercept` them. Both the `currentState` object as well as individual params can be observed.

```js

stateMachineRouter.emit('goToWork', { method: 'car' });

console.log(stateMachineRouter.currentState);
{
    name: 'WORK',
    params: {
        method: 'car'
    }
}
```

### Observing state changes

```js
observe(stateMachineRouter, 'currentState', () => {});
observe(stateMachineRouter.currentState.params, 'method', () => {});
```

### Intercepting state changes

```js
// reject state change
intercept(stateMachineRouter, 'currentState', object => {
  if (!loggedOut) {
    return { ...object, newValue: { name: 'LOGIN' } };
  }
  return object;
});
```

```js
import interceptAsync from 'mobx-intercept-async';

// reject state change
interceptAsync(stateMachineRouter, 'currentState', async object => {
  // log user in
  if (await login(object.newValue.params.userId)) {
    return object;
  }
  return { ...object, newValue: { name: 'LOGIN_ERROR' } };
});
```
