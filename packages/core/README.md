# @mobx-state-machine-router/core

> Declarative, predictable routing powered by finite state machines and MobX

[![npm version](https://img.shields.io/npm/v/@mobx-state-machine-router/core.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/core)
[![npm downloads](https://img.shields.io/npm/dm/@mobx-state-machine-router/core.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/core)

## Installation

```bash
npm install @mobx-state-machine-router/core mobx
```

## Quick Start

```typescript
import MobxStateMachineRouter, { TStates } from '@mobx-state-machine-router/core';

enum STATE {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
}

enum ACTION {
  goAbout = 'goAbout',
  goHome = 'goHome',
}

const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: { [ACTION.goAbout]: STATE.ABOUT },
  },
  [STATE.ABOUT]: {
    actions: { [ACTION.goHome]: STATE.HOME },
  },
};

const router = MobxStateMachineRouter({
  states,
  currentState: { name: STATE.HOME, params: {} },
});

// Navigate
router.emit(ACTION.goAbout);
console.log(router.currentState.name); // 'ABOUT'
```

## API

### `MobxStateMachineRouter(options)`

Creates a router instance.

| Option | Type | Description |
|--------|------|-------------|
| `states` | `TStates<S, A>` | State machine definition |
| `currentState` | `{ name: S, params: P }` | Initial state (optional) |
| `persistence` | `IPersistence` | URL persistence layer (optional) |

### `router.currentState`

Observable object with current state:

```typescript
router.currentState.name   // Current state name
router.currentState.params // Current params
```

### `router.emit(action, params?)`

Emit an action to transition states:

```typescript
router.emit(ACTION.goAbout);
router.emit(ACTION.viewItem, { id: '123' });
```

### `router.destroy()`

Clean up subscriptions.

### `observeParam(router, property, paramName, callback)`

Observe a specific param for changes:

```typescript
import { observeParam } from '@mobx-state-machine-router/core';

observeParam(router, 'currentState', 'id', (change) => {
  console.log('id changed:', change.newValue);
});
```

## With React

```tsx
import { observer } from 'mobx-react-lite';

const App = observer(() => {
  return (
    <div>
      {router.currentState.name === STATE.HOME && <Home />}
      {router.currentState.name === STATE.ABOUT && <About />}
    </div>
  );
});
```

## Full Documentation

See the [main README](https://github.com/anzorb/mobx-state-machine-router#readme) for complete documentation including:

- Observing & intercepting state changes
- URL persistence
- TypeScript usage
- Examples

## License

MIT
