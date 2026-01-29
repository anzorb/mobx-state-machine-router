import { observer } from "mobx-react-lite";
import { Highlight, themes } from "prism-react-renderer";

const CodeBlock = ({
  children,
  title,
  language = "tsx",
}: {
  children: string;
  title: string;
  language?: string;
}) => (
  <div className="bg-gray-900 rounded-lg overflow-hidden">
    <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm font-medium">
      {title}
    </div>
    <Highlight theme={themes.nightOwl} code={children.trim()} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className="p-4 overflow-x-auto text-sm" style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  </div>
);

export const ReactIntegrationPage = observer(() => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        React Integration
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Learn how to integrate MobX State Machine Router with React for
        observable, hash URL-based state machine routing.
      </p>

      {/* Setup Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Setup</h2>
        <p className="text-gray-600 mb-4">
          Install the packages and create your router configuration:
        </p>

        <CodeBlock title="Terminal" language="bash">
          {`npm install @mobx-state-machine-router/core \\
  @mobx-state-machine-router/url-persistence \\
  mobx mobx-react-lite history`}
        </CodeBlock>

        <div className="mt-4">
          <CodeBlock title="router.ts" language="typescript">
            {`import MobxStateMachineRouter, { TStates } from "@mobx-state-machine-router/core";
import URLPersistence from "@mobx-state-machine-router/url-persistence";

// Define states and actions as string literal types (kebab-case)
type State = "home" | "products" | "product-detail";
type Action = "go-home" | "go-products" | "view-product";

type Params = {
  productId?: string;
  category?: string;
};

// Define the state machine
const states: TStates<State, Action> = {
  home: {
    actions: {
      "go-products": "products",
    },
    url: "/",
  },
  products: {
    actions: {
      "go-home": "home",
      "go-products": "products", // Self-transition for params
      "view-product": "product-detail",
    },
    url: "/products",
  },
  "product-detail": {
    actions: {
      "go-products": "products",
    },
    url: "/product",
  },
};

// Create router with URL persistence (hash routing)
export const router = MobxStateMachineRouter<State, Params, Action>({
  states,
  currentState: { name: "home", params: {} },
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
          Wrap components with <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">observer</code> from{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">mobx-react-lite</code> to
          automatically re-render when state changes:
        </p>

        <CodeBlock title="App.tsx" language="tsx">
          {`import { observer } from "mobx-react-lite";
import { router } from "./router";

const App = observer(() => {
  const { name, params } = router.currentState;

  return (
    <div>
      <nav>
        <button onClick={() => router.emit("go-home")}>
          Home
        </button>
        <button onClick={() => router.emit("go-products")}>
          Products
        </button>
      </nav>

      {/* Render based on current state */}
      {name === "home" && <HomePage />}
      {name === "products" && <ProductsPage />}
      {name === "product-detail" && (
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

        <CodeBlock title="ProductsPage.tsx" language="tsx">
          {`const ProductsPage = observer(() => {
  const { category, search } = router.currentState.params;

  const handleFilter = (newCategory: string) => {
    // Self-transition to update params without changing state
    router.emit("go-products", {
      ...router.currentState.params,
      category: newCategory,
    });
    // URL becomes: /#/products?category=electronics
  };

  const handleViewProduct = (id: string) => {
    router.emit("view-product", { productId: id });
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
          Use MobX's <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">observe</code> or{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">autorun</code> for side effects:
        </p>

        <CodeBlock title="Analytics & Effects" language="typescript">
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
  const disposer = observeParam(
    router,
    "currentState",
    "productId",
    (change) => {
      // Fetch product data when productId changes
      fetchProduct(change.newValue.params.productId);
    }
  );
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
          Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">intercept</code> to guard routes or redirect:
        </p>

        <CodeBlock title="Sync Auth Guard" language="typescript">
          {`import { intercept } from "mobx";

// Protect routes that require authentication
intercept(router, "currentState", (change) => {
  const protectedStates = ["profile", "settings"];

  if (protectedStates.includes(change.newValue.name) && !isAuthenticated) {
    // Redirect to login instead
    return {
      ...change,
      newValue: {
        name: "login",
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

        <p className="text-gray-600 my-4">
          For async operations like API calls, use{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">interceptAsync</code> from{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">mobx-async-intercept</code>:
        </p>

        <CodeBlock title="Async Route Guard" language="typescript">
          {`import interceptAsync from "mobx-async-intercept";

// Async permission check before navigation
interceptAsync(router, "currentState", async (change) => {
  if (change.newValue.name === "admin") {
    // Check permissions with API call
    const hasPermission = await checkAdminPermission();
    
    if (!hasPermission) {
      return {
        ...change,
        newValue: {
          name: "unauthorized",
          params: {},
        },
      };
    }
  }
  
  return change;
});

// Async data validation before leaving a page
interceptAsync(router, "currentState", async (change) => {
  if (router.currentState.name === "checkout") {
    // Validate cart before leaving checkout
    const isValid = await validateCart();
    
    if (!isValid) {
      showError("Please fix cart errors before leaving");
      return null; // Cancel navigation
    }
  }
  
  return change;
});

// Load data before entering a page
interceptAsync(router, "currentState", async (change) => {
  if (change.newValue.name === "product-detail") {
    const productId = change.newValue.params.productId;
    
    try {
      // Pre-fetch product data
      await prefetchProduct(productId);
    } catch (error) {
      // Redirect to error page if fetch fails
      return {
        ...change,
        newValue: {
          name: "not-found",
          params: { message: "Product not found" },
        },
      };
    }
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
    </div>
  );
});
