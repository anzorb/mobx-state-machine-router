[![CircleCI](https://circleci.com/gh/interestingChoice/mobx-state-machine-router.svg?style=svg)](https://circleci.com/gh/interestingChoice/mobx-state-machine-router)

[![codecov](https://codecov.io/gh/interestingChoice/mobx-state-machine-router/branch/master/graph/badge.svg)](https://codecov.io/gh/interestingChoice/mobx-state-machine-router)

### Motivation

- Predictable UIs based on a simple state-map, and a set of actions and params
  ```js
  {
    'HOME': {
        actions: {
            goToWork: 'WORK'
        }
    },
    'WORK': {...
  ```
- Components are shown/hidden when state or params change via `mobx.observer` or the `Observer` component
- Side Effects can react to state too, via React's `useEffect()`

  ```js
  useEffect(() => {
    // do something with state
  }, [router.currentState]);
  ```

- Emitting an action produces a new state
  ```
  emit(actionName: string, query: object = {})
  ```
- Ability to use `mobx.observe` and `mobx.intercept` to reject/modify/intercept state changes
- Optional URL persistence with deep linking
- React Native support OOB

---

### Installation

```js
npm install mobx-state-machine-router
```

or

```js
yarn add mobx-state-machine-router
```

---

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

---

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

---

### Observing state changes

```js
observe(stateMachineRouter, 'currentState', () => {});
observe(stateMachineRouter.currentState.params, 'method', () => {});
```

---

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

---

### Rendering UI Elements

The Router can be accessed in using React's Context API or other means. Components wrapped in observer will re-render whenever state changes.

```jsx
import { observer } from 'mobx-react';

export const App = observer(() => {
  const { currentState } = router;

  return (
    <>
    { currentState.name === 'home' && <Home> }
    { currentState.name === 'about' && <About> }
    </>
  )
});
```
