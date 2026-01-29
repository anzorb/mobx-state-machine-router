<p align="center">
  <img src="https://raw.githubusercontent.com/mobxjs/mobx/main/docs/assets/mobx.png" alt="MobX" width="80" />
</p>

<h1 align="center">MobX State Machine Router</h1>

<p align="center">
  <strong>Declarative, predictable routing for React & React Native powered by finite state machines and MobX</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mobx-state-machine-router/core"><img src="https://img.shields.io/npm/v/@mobx-state-machine-router/core.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@mobx-state-machine-router/core"><img src="https://img.shields.io/npm/dm/@mobx-state-machine-router/core.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://github.com/anzorb/mobx-state-machine-router/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/anzorb/mobx-state-machine-router/ci.yml?branch=master&style=flat-square" alt="CI" /></a>
  <a href="https://codecov.io/gh/anzorb/mobx-state-machine-router"><img src="https://img.shields.io/codecov/c/github/anzorb/mobx-state-machine-router?style=flat-square" alt="codecov" /></a>
  <a href="https://github.com/anzorb/mobx-state-machine-router/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@mobx-state-machine-router/core.svg?style=flat-square" alt="license" /></a>
</p>

<p align="center">
  <a href="https://anzorb.github.io/mobx-state-machine-router/">Live Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#url-persistence">URL Persistence</a> •
  <a href="#examples">Examples</a>
</p>

---

## Why?

Traditional routers map URLs to components. **MobX State Machine Router** takes a different approach:

- **🎯 State Machine First** — Define valid states and transitions. Invalid navigation is impossible by design.
- **⚡ MobX Powered** — Reactive state updates with fine-grained re-rendering. No unnecessary renders.
- **🔗 URL Persistence Optional** — Works great without URLs (React Native) or with hash/browser history.
- **🔒 Type Safe** — Full TypeScript support with inferred types for states, actions, and params.
- **🪶 Lightweight** — ~3KB gzipped with zero dependencies (MobX is a peer dependency).

## Installation

```bash
# npm
npm install @mobx-state-machine-router/core mobx

# yarn
yarn add @mobx-state-machine-router/core mobx

# pnpm
pnpm add @mobx-state-machine-router/core mobx
```

## Quick Start

```typescript
import MobxStateMachineRouter, { TStates } from '@mobx-state-machine-router/core';

// 1. Define your states and actions as string literal types
type State = 'HOME' | 'PRODUCTS' | 'PRODUCT_DETAIL';
type Action = 'viewProducts' | 'viewProduct' | 'goHome';

type Params = {
  productId?: string;
};

// 2. Define the state machine
const states: TStates<State, Action> = {
  HOME: {
    actions: {
      viewProducts: 'PRODUCTS',
    },
  },
  PRODUCTS: {
    actions: {
      goHome: 'HOME',
      viewProduct: 'PRODUCT_DETAIL',
    },
  },
  PRODUCT_DETAIL: {
    actions: {
      goHome: 'HOME',
      viewProducts: 'PRODUCTS',
    },
  },
};

// 3. Create the router
const router = MobxStateMachineRouter<State, Params, Action>({
  states,
  currentState: { name: 'HOME', params: {} },
});

// 4. Navigate by emitting actions
router.emit('viewProducts');
console.log(router.currentState.name); // 'PRODUCTS'

// Pass params with navigation
router.emit('viewProduct', { productId: '123' });
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
        <button onClick={() => router.emit('goHome')}>Home</button>
        <button onClick={() => router.emit('viewProducts')}>Products</button>
      </nav>

      {name === 'HOME' && <HomePage />}
      {name === 'PRODUCTS' && <ProductsPage />}
      {name === 'PRODUCT_DETAIL' && <ProductDetail id={params.productId} />}
    </div>
  );
});
```

## API

### `MobxStateMachineRouter(options)`

Creates a new router instance.

```typescript
const router = MobxStateMachineRouter<States, Params, Actions>({
  states: TStates<States, Actions>,  // State machine definition
  currentState?: {                    // Initial state (optional)
    name: States,
    params: Params,
  },
  persistence?: IPersistence,         // URL persistence layer (optional)
});
```

### `router.currentState`

Observable object containing the current state name and params.

```typescript
router.currentState.name   // Current state name
router.currentState.params // Current params object
```

### `router.emit(action, params?)`

Transition to a new state by emitting an action.

```typescript
router.emit('goHome');                      // Simple navigation
router.emit('viewProduct', { id: '1' });    // With params
```

### `observeParam(router, property, paramName, callback)`

Observe changes to a specific param.

```typescript
import { observeParam } from '@mobx-state-machine-router/core';

observeParam(router, 'currentState', 'productId', (change) => {
  console.log('productId changed:', change.newValue);
});
```

## Observing & Intercepting

### Observe State Changes

```typescript
import { observe, autorun } from 'mobx';

// React to any state change
observe(router, 'currentState', ({ newValue }) => {
  console.log('Navigated to:', newValue.name);
});

// Or use autorun for reactive effects
autorun(() => {
  analytics.track('page_view', { page: router.currentState.name });
});
```

### Intercept State Changes

Guard navigation or redirect users:

```typescript
import { intercept } from 'mobx';

intercept(router, 'currentState', (change) => {
  // Redirect unauthenticated users
  if (change.newValue.name === 'ADMIN' && !isLoggedIn) {
    return { ...change, newValue: { name: 'LOGIN', params: {} } };
  }
  return change;
});
```

### Async Interception

```typescript
import interceptAsync from 'mobx-async-intercept';

interceptAsync(router, 'currentState', async (change) => {
  if (change.newValue.name === 'CHECKOUT') {
    const canCheckout = await validateCart();
    if (!canCheckout) {
      return { ...change, newValue: { name: 'CART_ERROR', params: {} } };
    }
  }
  return change;
});
```

## URL Persistence

Add URL synchronization with hash or browser history:

```bash
pnpm add @mobx-state-machine-router/url-persistence history
```

```typescript
import MobxStateMachineRouter from '@mobx-state-machine-router/core';
import URLPersistence from '@mobx-state-machine-router/url-persistence';

// Add URL to each state
const states: TStates<State, Action> = {
  HOME: {
    actions: { viewProducts: 'PRODUCTS' },
    url: '/',
  },
  PRODUCTS: {
    actions: { viewProduct: 'PRODUCT_DETAIL' },
    url: '/products',
  },
  PRODUCT_DETAIL: {
    actions: { viewProducts: 'PRODUCTS' },
    url: '/product',
  },
};

// Create router with URL persistence
const router = MobxStateMachineRouter<State, Params, Action>({
  states,
  currentState: { name: 'HOME', params: {} },
  persistence: URLPersistence(),  // Uses hash history by default
});

// Navigation now updates the URL!
router.emit('viewProduct', { productId: '123' });
// URL: /#/product?productId=123
```

### Custom History

```typescript
import { createBrowserHistory, createMemoryHistory } from 'history';

// Browser history (requires server configuration)
URLPersistence({ history: createBrowserHistory() });

// Memory history (useful for testing)
URLPersistence({ history: createMemoryHistory() });
```

### Custom Serializers

Handle complex param types:

```typescript
URLPersistence({
  serializers: {
    filters: {
      getter: (value) => JSON.parse(decodeURIComponent(value)),
      setter: (value) => encodeURIComponent(JSON.stringify(value)),
    },
  },
});
```

## Examples

**[Live Demo](https://anzorb.github.io/mobx-state-machine-router/)** — Try it in your browser!

Check out the [example app](./example) for a complete demo with:

- Multi-page navigation
- URL persistence with hash routing  
- Query parameter filtering
- TypeScript throughout

Run locally:

```bash
cd example
pnpm install
pnpm dev
```

## TypeScript

This library is written in TypeScript and provides full type inference:

```typescript
// States and actions are type-checked
router.emit('invalidAction'); // TS Error!

// Params are typed
router.emit('viewProduct', { productId: 123 }); // TS Error if wrong type
```

## Packages

| Package | Description |
|---------|-------------|
| [@mobx-state-machine-router/core](./packages/core) | Core router with state machine logic |
| [@mobx-state-machine-router/url-persistence](./packages/url-persistence) | URL synchronization with hash/browser history |

## Requirements

- MobX 4.x, 5.x, or 6.x
- Node.js 18+

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build packages
pnpm build

# Run example app
cd example && pnpm dev
```

## License

MIT © [Anzor Bashkhaz](https://github.com/anzorb)
