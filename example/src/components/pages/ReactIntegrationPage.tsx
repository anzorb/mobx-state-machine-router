import { observer } from "mobx-react-lite";
import { router, ACTION } from "../../router";
import { useEffect, useState } from "react";
import { observe } from "mobx";

// Example: A component that reacts to state changes
const StateObserver = observer(() => {
  const { name, params } = router.currentState;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <h4 className="font-semibold text-indigo-900 mb-2">Live State</h4>
      <div className="font-mono text-sm">
        <div>
          <span className="text-gray-600">State:</span>{" "}
          <span className="text-indigo-600">{name}</span>
        </div>
        <div>
          <span className="text-gray-600">Params:</span>{" "}
          <span className="text-indigo-600">{JSON.stringify(params)}</span>
        </div>
        <div>
          <span className="text-gray-600">URL:</span>{" "}
          <span className="text-indigo-600">{window.location.hash}</span>
        </div>
      </div>
    </div>
  );
});

// Example: Using useEffect with MobX observe
const StateChangeLogger = () => {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const disposer = observe(router, "currentState", (change) => {
      const entry = `${new Date().toLocaleTimeString()}: ${change.oldValue?.name} → ${change.newValue.name}`;
      setLog((prev) => [...prev.slice(-4), entry]);
    });

    return () => disposer();
  }, []);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-2">State Change Log</h4>
      <div className="font-mono text-xs space-y-1">
        {log.length === 0 ? (
          <span className="text-gray-400">Navigate to see changes...</span>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-gray-600">
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CodeBlock = ({
  children,
  title,
}: {
  children: string;
  title: string;
}) => (
  <div className="bg-gray-900 rounded-lg overflow-hidden">
    <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm font-medium">
      {title}
    </div>
    <pre className="p-4 overflow-x-auto text-sm">
      <code className="text-gray-100">{children}</code>
    </pre>
  </div>
);

export const ReactIntegrationPage = observer(() => {
  const [counter, setCounter] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        React Integration
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Learn how to integrate MobX State Machine Router with React for
        observable, hash URL-based state machine routing.
      </p>

      {/* Live Demo Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Demo</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <StateObserver />
          <StateChangeLogger />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => router.emit(ACTION.goHome)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Go Home
          </button>
          <button
            onClick={() => router.emit(ACTION.goProducts)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Go Products
          </button>
          <button
            onClick={() =>
              router.emit(ACTION.goProducts, { category: "electronics" })
            }
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Products + Category
          </button>
          <button
            onClick={() => router.emit(ACTION.viewProduct, { productId: "42" })}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            View Product #42
          </button>
        </div>
      </section>

      {/* Setup Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Setup</h2>
        <p className="text-gray-600 mb-4">
          Install the packages and create your router configuration:
        </p>

        <CodeBlock title="terminal">
          {`npm install @mobx-state-machine-router/core \\
           @mobx-state-machine-router/url-persistence \\
           mobx mobx-react-lite history`}
        </CodeBlock>

        <div className="mt-4">
          <CodeBlock title="router.ts">
            {`import MobxStateMachineRouter, { TStates } from "@mobx-state-machine-router/core";
import URLPersistence from "@mobx-state-machine-router/url-persistence";

// Define states and actions as enums for type safety
enum STATE {
  HOME = "HOME",
  PRODUCTS = "PRODUCTS",
  PRODUCT_DETAIL = "PRODUCT_DETAIL",
}

enum ACTION {
  goHome = "goHome",
  goProducts = "goProducts",
  viewProduct = "viewProduct",
}

// Define the state machine
const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: {
      [ACTION.goProducts]: STATE.PRODUCTS,
    },
    url: "/",
  },
  [STATE.PRODUCTS]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goProducts]: STATE.PRODUCTS, // Self-transition for params
      [ACTION.viewProduct]: STATE.PRODUCT_DETAIL,
    },
    url: "/products",
  },
  [STATE.PRODUCT_DETAIL]: {
    actions: {
      [ACTION.goProducts]: STATE.PRODUCTS,
    },
    url: "/product",
  },
};

// Create router with URL persistence (hash routing)
export const router = MobxStateMachineRouter({
  states,
  currentState: { name: STATE.HOME, params: {} },
  persistence: URLPersistence(), // Enables hash-based URLs
});`}
          </CodeBlock>
        </div>
      </section>

      {/* Observer Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          2. Observable Components
        </h2>
        <p className="text-gray-600 mb-4">
          Wrap components with <code className="bg-gray-100 px-1 rounded">observer</code> from{" "}
          <code className="bg-gray-100 px-1 rounded">mobx-react-lite</code> to
          automatically re-render when state changes:
        </p>

        <CodeBlock title="App.tsx">
          {`import { observer } from "mobx-react-lite";
import { router, STATE, ACTION } from "./router";

const App = observer(() => {
  const { name, params } = router.currentState;

  return (
    <div>
      <nav>
        <button onClick={() => router.emit(ACTION.goHome)}>
          Home
        </button>
        <button onClick={() => router.emit(ACTION.goProducts)}>
          Products
        </button>
      </nav>

      {/* Render based on current state */}
      {name === STATE.HOME && <HomePage />}
      {name === STATE.PRODUCTS && <ProductsPage />}
      {name === STATE.PRODUCT_DETAIL && (
        <ProductDetail productId={params.productId} />
      )}
    </div>
  );
});`}
        </CodeBlock>
      </section>

      {/* Navigation Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          3. Navigation & Params
        </h2>
        <p className="text-gray-600 mb-4">
          Navigate by emitting actions. Pass params to update the URL query string:
        </p>

        <CodeBlock title="ProductsPage.tsx">
          {`const ProductsPage = observer(() => {
  const { category, search } = router.currentState.params;

  const handleFilter = (newCategory: string) => {
    // Self-transition to update params without changing state
    router.emit(ACTION.goProducts, {
      ...router.currentState.params,
      category: newCategory,
    });
    // URL becomes: /#/products?category=electronics
  };

  const handleViewProduct = (id: string) => {
    router.emit(ACTION.viewProduct, { productId: id });
    // URL becomes: /#/product?productId=123
  };

  return (
    <div>
      <select value={category} onChange={(e) => handleFilter(e.target.value)}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
      </select>

      {products.map((p) => (
        <div key={p.id} onClick={() => handleViewProduct(p.id)}>
          {p.name}
        </div>
      ))}
    </div>
  );
});`}
        </CodeBlock>
      </section>

      {/* Side Effects Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          4. Side Effects & Observation
        </h2>
        <p className="text-gray-600 mb-4">
          Use MobX's <code className="bg-gray-100 px-1 rounded">observe</code> or{" "}
          <code className="bg-gray-100 px-1 rounded">autorun</code> for side effects:
        </p>

        <CodeBlock title="Analytics Example">
          {`import { observe, autorun } from "mobx";
import { observeParam } from "@mobx-state-machine-router/core";

// Track page views
useEffect(() => {
  const disposer = observe(router, "currentState", (change) => {
    analytics.track("page_view", {
      page: change.newValue.name,
      params: change.newValue.params,
    });
  });
  return () => disposer();
}, []);

// React to specific param changes
useEffect(() => {
  const disposer = observeParam(router, "currentState", "productId", (change) => {
    // Fetch product data when productId changes
    fetchProduct(change.newValue.params.productId);
  });
  return () => disposer();
}, []);

// Autorun for reactive effects
useEffect(() => {
  const disposer = autorun(() => {
    document.title = \`My App - \${router.currentState.name}\`;
  });
  return () => disposer();
}, []);`}
        </CodeBlock>
      </section>

      {/* Intercepting Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          5. Route Guards
        </h2>
        <p className="text-gray-600 mb-4">
          Use <code className="bg-gray-100 px-1 rounded">intercept</code> to guard routes or redirect:
        </p>

        <CodeBlock title="Auth Guard Example">
          {`import { intercept } from "mobx";

// Protect routes that require authentication
intercept(router, "currentState", (change) => {
  const protectedStates = [STATE.PROFILE, STATE.SETTINGS];
  
  if (protectedStates.includes(change.newValue.name) && !isAuthenticated) {
    // Redirect to login instead
    return {
      ...change,
      newValue: {
        name: STATE.LOGIN,
        params: { returnTo: change.newValue.name },
      },
    };
  }
  
  return change; // Allow navigation
});

// Or block navigation entirely
intercept(router, "currentState", (change) => {
  if (hasUnsavedChanges && !confirm("Discard changes?")) {
    return null; // Cancel navigation
  }
  return change;
});`}
        </CodeBlock>
      </section>

      {/* Benefits Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Type-Safe Navigation
            </h3>
            <p className="text-gray-600 text-sm">
              TypeScript ensures you can only emit valid actions and prevents
              invalid state transitions at compile time.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Predictable State
            </h3>
            <p className="text-gray-600 text-sm">
              The state machine guarantees only valid transitions happen. No
              unexpected states or navigation bugs.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              URL Persistence
            </h3>
            <p className="text-gray-600 text-sm">
              Hash-based URLs work everywhere (GitHub Pages, S3, etc.) with full
              deep-linking and browser history support.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Fine-Grained Reactivity
            </h3>
            <p className="text-gray-600 text-sm">
              MobX ensures only components that depend on changed state
              re-render. No unnecessary renders.
            </p>
          </div>
        </div>
      </section>

      {/* Counter to prove reactivity is isolated */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Isolated Reactivity Demo
        </h2>
        <p className="text-gray-600 mb-4">
          This counter is local React state. Clicking it doesn't affect the router,
          and router changes don't reset it—proving MobX reactivity is properly isolated:
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCounter((c) => c + 1)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Counter: {counter}
          </button>
          <span className="text-gray-500 text-sm">
            (Navigate around—this won't reset)
          </span>
        </div>
      </section>
    </div>
  );
});
