[![CircleCI](https://circleci.com/gh/anzorb/mobx-state-machine-router.svg?style=svg)](https://circleci.com/gh/anzorb/mobx-state-machine-router)

[![codecov](https://codecov.io/gh/anzorb/mobx-state-machine-router/branch/master/graph/badge.svg)](https://codecov.io/gh/anzorb/mobx-state-machine-router)

### Motivation

- State Machines are great for declarative, predictable UI transitions
- MobX is great at re-rendering UIs, observing and intercepting changes
- Combining these two, and making URL persistence separate (and optional), brings modern, simple, predictable routing to React and React Native apps using Mobx 4+

### How it works

- A State Map is defined with a set of states and their actions (example in typescript):

  ```typescript
  const states: TStates<STATE, ACTION> = {
    [STATE.HOME]: {
      actions: {
        [ACTION.goToWork]: STATE.WORK,
        [ACTION.clean]: STATE.HOME,
      },
      url: '/',
    },
    [STATE.WORK]: {
      actions: {
        [ACTION.goHome]: STATE.HOME,
        [ACTION.slack]: STATE.WORK,
        [ACTION.getFood]: STATE['WORK/LUNCHROOM'],
      },
      url: '/work',
    },
  };
  ```

- Emitting an action produces a new state
  ```typescript
  IMobxStateMachineRouter<STATE, PARAM, ACTION>.emit: (actionName: ACTION, params?: PARAM | undefined) => void
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

```typescript
enum STATE {
  HOME = 'HOME',
  WORK = 'WORK'
}

enum ACTION {
  goToWork = 'goToWork',
  clean = 'clean',
  slack = 'slack',
  ...
}

type TParams = {
  activity?: string | null;
};

const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: {
      [ACTION.goToWork]: STATE.WORK,
      [ACTION.clean]: STATE.HOME,
    },
    url: '/', // specify URL if using URLPersistence package
  },
  [STATE.WORK]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.slack]: STATE.WORK,
    },
    url: '/work', // specify URL if using URLPersistence package
  }
};

stateMachineRouter.emit(ACTION.goToWork);

console.log(stateMachineRouter.currentState.name);
> 'WORK'

stateMachineRouter.emit(ACTION.goToWork);
> 'WORK' // ==> ignored as only the HOME state is allowed to "goToWork"
```

---

### Passing Params

State params can be passed in as follows:

```js

stateMachineRouter.emit(ACTION.goToWork, { method: 'car' });

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

Observing state changes is done using mobx's `observe`, and more granularly using `observeParam`:

```js
import { observe } from 'mobx';
import { observeParam } from '@mobx-state-machine-router/core';

observe(stateMachineRouter, 'currentState', () => {});
observeParam(stateMachineRouter, 'currentState', 'method', () => {});
```

---

### Intercepting state changes

Intercepting state changes can be used to either redirect to a different state, or do nothing (`return null`);

Here's an example of a synchronous intercept:

```js
import { intercept } from 'mobx';

// reject state change
intercept(stateMachineRouter, 'currentState', (change) => {
  if (!loggedOut) {
    return { ...change, newValue: { name: STATE.LOGIN } };
  }
  return change;
});
```

Here's an example of a asynchronous intercept:

```js
import interceptAsync from 'mobx-intercept-async';

// reject state change
interceptAsync(stateMachineRouter, 'currentState', async (change) => {
  // log user in
  if (await login(userId)) {
    return change;
  }
  return { ...change, newValue: { name: STATE.LOGIN_ERROR } };
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
    { currentState.name === STATE.HOME && <Home> }
    { currentState.name === STATE.ABOUT && <About> }
    </>
  )
});
```
