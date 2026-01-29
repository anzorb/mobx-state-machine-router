# @mobx-state-machine-router/url-persistence

> URL synchronization for MobX State Machine Router with hash/browser history support

[![npm version](https://img.shields.io/npm/v/@mobx-state-machine-router/url-persistence.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/url-persistence)
[![npm downloads](https://img.shields.io/npm/dm/@mobx-state-machine-router/url-persistence.svg?style=flat-square)](https://www.npmjs.com/package/@mobx-state-machine-router/url-persistence)

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
}

enum ACTION {
  viewProducts = 'viewProducts',
  goHome = 'goHome',
}

// Add URL to each state
const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: { [ACTION.viewProducts]: STATE.PRODUCTS },
    url: '/',
  },
  [STATE.PRODUCTS]: {
    actions: { [ACTION.goHome]: STATE.HOME },
    url: '/products',
  },
};

// Create router with URL persistence
const router = MobxStateMachineRouter({
  states,
  currentState: { name: STATE.HOME, params: {} },
  persistence: URLPersistence(),
});

// Navigation now updates the URL
router.emit(ACTION.viewProducts);
// URL: /#/products

router.emit(ACTION.viewProducts, { category: 'electronics' });
// URL: /#/products?category=electronics
```

## API

### `URLPersistence(options?)`

Creates a URL persistence layer.

| Option | Type | Description |
|--------|------|-------------|
| `history` | `History` | Custom history instance (default: hash history) |
| `serializers` | `ISerializers` | Custom param serializers |

### Custom History

```typescript
import { createBrowserHistory, createHashHistory, createMemoryHistory } from 'history';

// Hash history (default) - works everywhere
URLPersistence();
URLPersistence({ history: createHashHistory() });

// Browser history - cleaner URLs, requires server config
URLPersistence({ history: createBrowserHistory() });

// Memory history - for testing
URLPersistence({ history: createMemoryHistory() });
```

### Custom Serializers

Handle complex param types like arrays, objects, or booleans:

```typescript
URLPersistence({
  serializers: {
    // Boolean serializer
    isActive: {
      getter: (value) => value === 'true',
      setter: (value) => value.toString(),
    },
    // Array serializer
    tags: {
      getter: (value) => JSON.parse(decodeURIComponent(value)),
      setter: (value) => encodeURIComponent(JSON.stringify(value)),
    },
  },
});
```

## URL Structure

The URL structure follows this pattern:

```
/#/[state-url]?[param1]=[value1]&[param2]=[value2]
```

Examples:
- `/#/` → HOME state
- `/#/products` → PRODUCTS state  
- `/#/products?category=electronics` → PRODUCTS with category param
- `/#/product?productId=123` → PRODUCT_DETAIL with productId param

## Features

- **Hash Routing** — Works on any static host (GitHub Pages, S3, etc.)
- **Browser History** — Clean URLs with proper server configuration
- **Query Parameters** — Automatically syncs params to URL
- **Deep Linking** — Users can bookmark and share URLs
- **Back/Forward** — Full browser history support

## Full Documentation

See the [main README](https://github.com/anzorb/mobx-state-machine-router#readme) for complete documentation.

## License

MIT
