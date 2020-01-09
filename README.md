[![CircleCI](https://circleci.com/gh/anzorb/mobx-state-machine-router.svg?style=svg)](https://circleci.com/gh/anzorb/mobx-state-machine-router)

[![codecov](https://codecov.io/gh/anzorb/mobx-state-machine-router/branch/master/graph/badge.svg)](https://codecov.io/gh/anzorb/mobx-state-machine-router)

### Motivation

- State Machines are great for declarative, predictable UI transitions
- MobX is great at re-rendering UIs, observing and intercepting changes
- Combining these two, and making URL persistence separate (and optional), brings modern, simple, predictable routing to React and React Native apps using Mobx 4+

### How it works

- A State Map is defined with a set of states and their actions:
  ```js
  {
    'HOME': {
        actions: {
            goToWork: 'WORK'
        }
    },
    'WORK': {...
  ```
- Emitting an action produces a new state
  ```
  emit(actionName: string, query: object = {})
  ```
- Components are re-rendered automatically thanks to Mobx' `Observer` HOC and `@observer` decorator
- Side Effects can also happen when state/params change using React's `useEffect()`, `mobx.observe()` or `mobx.autorun()`

  ```js
  useEffect(() => {
    // do something with state
  }, [router.currentState]);
  ```

- `mobx.intercept` can be used for error handling, and `interceptAsync` can be used for async side-effects
- URL persistence is optional and separate
- First class React Native support

---

### Installation

```js
npm install @mobx-state-machine-router/core
```

or

```js
yarn add @mobx-state-machine-router/core
```

---

### Basics

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
