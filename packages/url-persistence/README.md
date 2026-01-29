# @mobx-state-machine-router/url-persistence

> URL synchronization for MobX State Machine Router with hash/browser history support

[![npm version](https://img.shields.io/npm/v/@mobx-state-machine-router/url-persistence.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/url-persistence)
[![npm downloads](https://img.shields.io/npm/dm/@mobx-state-machine-router/url-persistence.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/url-persistence)
[![CI](https://img.shields.io/github/actions/workflow/status/anzorb/mobx-state-machine-router/ci.yml?branch=master&style=flat-square)](https://github.com/anzorb/mobx-state-machine-router/actions)
[![codecov](https://img.shields.io/codecov/c/github/anzorb/mobx-state-machine-router?style=flat-square)](https://codecov.io/gh/anzorb/mobx-state-machine-router)
[![license](https://img.shields.io/npm/l/@mobx-state-machine-router/url-persistence.svg?style=flat-square)](https://github.com/anzorb/mobx-state-machine-router/blob/master/LICENSE)

**[Live Demo](https://anzorb.github.io/mobx-state-machine-router/)** | **[GitHub](https://github.com/anzorb/mobx-state-machine-router)**

## Features

- **Hash Routing** — Works on any static host (GitHub Pages, S3, Netlify, etc.)
- **Browser History** — Clean URLs with proper server configuration
- **Query Parameters** — Automatically syncs params to URL
- **Deep Linking** — Users can bookmark and share URLs
- **Back/Forward** — Full browser history support
- **Custom Serializers** — Handle complex types (arrays, objects, booleans)

## Installation

```bash
npm install @mobx-state-machine-router/url-persistence @mobx-state-machine-router/core history mobx
```

## Quick Start

```typescript
import MobxStateMachineRouter, { TStates } from '@mobx-state-machine-router/core';
import URLPersistence from '@mobx-state-machine-router/url-persistence';

enum STATE {
  HOME = 'HOME',
  PRODUCTS = 'PRODUCTS',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
}

enum ACTION {
  viewProducts = 'viewProducts',
  viewProduct = 'viewProduct',
  goHome = 'goHome',
}

// Add `url` to each state
const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: { [ACTION.viewProducts]: STATE.PRODUCTS },
    url: '/',
  },
  [STATE.PRODUCTS]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.viewProduct]: STATE.PRODUCT_DETAIL,
      [ACTION.viewProducts]: STATE.PRODUCTS, // Self-transition for param updates
    },
    url: '/products',
  },
  [STATE.PRODUCT_DETAIL]: {
    actions: { [ACTION.viewProducts]: STATE.PRODUCTS },
    url: '/product',
  },
};

// Create router with URL persistence
const router = MobxStateMachineRouter({
  states,
  currentState: { name: STATE.HOME, params: {} },
  persistence: URLPersistence(),
});

// Navigation now updates the URL!
router.emit(ACTION.viewProducts);
// URL: /#/products

router.emit(ACTION.viewProduct, { productId: '123' });
// URL: /#/product?productId=123

router.emit(ACTION.viewProducts, { category: 'electronics', search: 'phone' });
// URL: /#/products?category=electronics&search=phone
```

## API

### `URLPersistence(options?)`

Creates a URL persistence layer.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `history` | `History` | `createHashHistory()` | History instance |
| `serializers` | `ISerializers` | `{}` | Custom param serializers |

### Custom History

```typescript
import { createBrowserHistory, createHashHistory, createMemoryHistory } from 'history';

// Hash history (default) - works everywhere, no server config needed
URLPersistence();
URLPersistence({ history: createHashHistory() });

// Browser history - cleaner URLs, requires server config for direct access
URLPersistence({ history: createBrowserHistory() });

// Memory history - useful for testing or SSR
URLPersistence({ history: createMemoryHistory() });
```

### Custom Serializers

Handle complex param types:

```typescript
URLPersistence({
  serializers: {
    // Boolean
    isActive: {
      getter: (value) => value === 'true',
      setter: (value) => String(value),
    },
    // Array
    tags: {
      getter: (value) => JSON.parse(decodeURIComponent(value)),
      setter: (value) => encodeURIComponent(JSON.stringify(value)),
    },
    // Number
    page: {
      getter: (value) => parseInt(value, 10),
      setter: (value) => String(value),
    },
  },
});
```

## URL Structure

```
/#/[state-url]?[param1]=[value1]&[param2]=[value2]
```

| URL | State | Params |
|-----|-------|--------|
| `/#/` | HOME | `{}` |
| `/#/products` | PRODUCTS | `{}` |
| `/#/products?category=electronics` | PRODUCTS | `{ category: 'electronics' }` |
| `/#/product?productId=123` | PRODUCT_DETAIL | `{ productId: '123' }` |

## Self-Transitions for Query Params

To update query parameters without changing state, add a self-transition:

```typescript
[STATE.PRODUCTS]: {
  actions: {
    [ACTION.viewProducts]: STATE.PRODUCTS, // Self-transition
    // ... other actions
  },
  url: '/products',
},
```

Then emit with new params:

```typescript
// Update filters on the same page
router.emit(ACTION.viewProducts, { category: 'electronics' });
```

## Usage with React

```tsx
import { observer } from 'mobx-react-lite';

const ProductsPage = observer(() => {
  const { category, search } = router.currentState.params;

  const handleCategoryChange = (cat: string) => {
    router.emit(ACTION.viewProducts, { ...router.currentState.params, category: cat });
  };

  return (
    <div>
      <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
        <option value="">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      {/* URL automatically updates to /#/products?category=electronics */}
    </div>
  );
});
```

## Compatibility

- MobX 4.x, 5.x, or 6.x
- history 5.x
- Works with React, React Native (with memory history), Vue, or vanilla JS

## Related

- [@mobx-state-machine-router/core](https://www.npmjs.com/package/@mobx-state-machine-router/core) — Core router package

## License

MIT © [Anzor Bashkhaz](https://github.com/anzorb)
