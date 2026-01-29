# @mobx-state-machine-router/core

> Declarative, predictable routing powered by finite state machines and MobX

[![npm version](https://img.shields.io/npm/v/@mobx-state-machine-router/core.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/core)
[![npm downloads](https://img.shields.io/npm/dm/@mobx-state-machine-router/core.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/core)
[![CI](https://img.shields.io/github/actions/workflow/status/anzorb/mobx-state-machine-router/ci.yml?branch=master&style=flat-square)](https://github.com/anzorb/mobx-state-machine-router/actions)
[![codecov](https://img.shields.io/codecov/c/github/anzorb/mobx-state-machine-router?style=flat-square)](https://codecov.io/gh/anzorb/mobx-state-machine-router)
[![license](https://img.shields.io/npm/l/@mobx-state-machine-router/core.svg?style=flat-square)](https://github.com/anzorb/mobx-state-machine-router/blob/master/LICENSE)

**[Live Demo](https://anzorb.github.io/mobx-state-machine-router/)** | **[GitHub](https://github.com/anzorb/mobx-state-machine-router)**

## Why?

- **State Machine First** — Define valid states and transitions. Invalid navigation is impossible by design.
- **MobX Powered** — Reactive state updates with fine-grained re-rendering.
- **Type Safe** — Full TypeScript support with inferred types.
- **Lightweight** — ~3KB gzipped, zero dependencies (MobX is a peer dependency).
- **React Native Ready** — Works without URLs out of the box.

## Installation

```bash
npm install @mobx-state-machine-router/core mobx
```

## Quick Start

```typescript
import MobxStateMachineRouter, { TStates } from '@mobx-state-machine-router/core';

// 1. Define states and actions as string literal types
type State = 'home' | 'products' | 'product-detail';
type Action = 'go-products' | 'view-product' | 'go-home';

type Params = {
  productId?: string;
};

// 2. Define the state machine
const states: TStates<State, Action> = {
  home: {
    actions: { 'go-products': 'products' },
  },
  products: {
    actions: {
      'go-home': 'home',
      'view-product': 'product-detail',
    },
  },
  'product-detail': {
    actions: {
      'go-home': 'home',
      'go-products': 'products',
    },
  },
};

// 3. Create the router
const router = MobxStateMachineRouter<State, Params, Action>({
  states,
  currentState: { name: 'home', params: {} },
});

// 4. Navigate
router.emit('go-products');
console.log(router.currentState.name); // 'products'

router.emit('view-product', { productId: '123' });
console.log(router.currentState.params); // { productId: '123' }
```

## Usage with React

```tsx
import { observer } from 'mobx-react-lite';
import { router } from './router';

const App = observer(() => {
  const { name, params } = router.currentState;

  return (
    <div>
      <nav>
        <button onClick={() => router.emit('go-home')}>Home</button>
        <button onClick={() => router.emit('go-products')}>Products</button>
      </nav>

      {name === 'home' && <HomePage />}
      {name === 'products' && <ProductsPage />}
      {name === 'product-detail' && <ProductDetail id={params.productId} />}
    </div>
  );
});
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

Observable object containing current state:

```typescript
router.currentState.name   // Current state name
router.currentState.params // Current params object
```

### `router.emit(action, params?)`

Emit an action to transition states:

```typescript
router.emit('go-home');
router.emit('view-product', { productId: '123' });
```

### `router.destroy()`

Clean up subscriptions (important when using persistence).

### `observeParam(router, property, paramName, callback)`

Observe a specific param for changes:

```typescript
import { observeParam } from '@mobx-state-machine-router/core';

observeParam(router, 'currentState', 'productId', (change) => {
  console.log('productId changed:', change.newValue);
});
```

## Observing & Intercepting

```typescript
import { observe, intercept } from 'mobx';

// Observe state changes
observe(router, 'currentState', ({ newValue }) => {
  console.log('Navigated to:', newValue.name);
});

// Intercept and guard navigation
intercept(router, 'currentState', (change) => {
  if (change.newValue.name === 'admin' && !isLoggedIn) {
    return { ...change, newValue: { name: 'login', params: {} } };
  }
  return change;
});
```

## URL Persistence

For URL synchronization, install the companion package:

```bash
npm install @mobx-state-machine-router/url-persistence history
```

See [@mobx-state-machine-router/url-persistence](https://www.npmjs.com/package/@mobx-state-machine-router/url-persistence) for details.

## Compatibility

- MobX 4.x, 5.x, or 6.x
- React 16.8+ (for hooks) or React Native
- TypeScript 4.x or 5.x (optional)

## License

MIT © [Anzor Bashkhaz](https://github.com/anzorb)
