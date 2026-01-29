import { observer } from "mobx-react-lite";
import { router } from "../../router";

const products: Record<
  string,
  { id: string; name: string; description: string; features: string[] }
> = {
  "1": {
    id: "1",
    name: "State Machine Router",
    description:
      "A powerful routing solution based on finite state machines. Define your app's navigation as states and transitions.",
    features: [
      "Finite state machine based navigation",
      "Type-safe with TypeScript",
      "Works with any UI framework",
      "Predictable state transitions",
    ],
  },
  "2": {
    id: "2",
    name: "MobX Core",
    description:
      "Simple, scalable state management. MobX makes state management simple again by transparently applying functional reactive programming.",
    features: [
      "Observable state",
      "Computed values",
      "Reactions and autorun",
      "Actions for state modification",
    ],
  },
  "3": {
    id: "3",
    name: "React Integration",
    description:
      "Seamless integration with React using mobx-react-lite. Components automatically re-render when observed data changes.",
    features: [
      "observer() HOC",
      "useLocalObservable hook",
      "Fine-grained reactivity",
      "Minimal re-renders",
    ],
  },
  "4": {
    id: "4",
    name: "URL Persistence",
    description:
      "Keep your router state in sync with the browser URL. Supports hash routing and query parameters.",
    features: [
      "Hash-based routing",
      "Query parameter support",
      "Browser history integration",
      "Deep linking support",
    ],
  },
  "5": {
    id: "5",
    name: "TypeScript Support",
    description:
      "Full TypeScript support with type-safe states, actions, and parameters. Catch navigation errors at compile time.",
    features: [
      "Type-safe state definitions",
      "Autocomplete for actions",
      "Parameter type checking",
      "Generic type support",
    ],
  },
  "6": {
    id: "6",
    name: "Hash Routing",
    description:
      "Hash-based URL routing that works everywhere, including static file hosts and GitHub Pages.",
    features: [
      "No server configuration needed",
      "Works on static hosts",
      "Full browser history support",
      "Clean URL structure",
    ],
  },
};

export const ProductDetailPage = observer(() => {
  const productId = router.currentState.params.productId;
  const product = productId ? products[productId] : null;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Product Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The product you're looking for doesn't exist.
        </p>
        <button
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          onClick={() => router.emit("go-products")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const otherProducts = Object.values(products).filter(
    (p) => p.id !== productId
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 transition-colors"
        onClick={() => router.emit("go-products")}
      >
        <span>←</span>
        <span>Back to Products</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Loaded via interceptAsync
          </span>
        </div>
        <p className="text-lg text-gray-600 mb-6">{product.description}</p>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Features</h2>
          <ul className="space-y-2">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-600">
                <span className="text-green-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Current URL params: </span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-indigo-600">
            {JSON.stringify(router.currentState.params)}
          </code>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Other Products
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {otherProducts.slice(0, 3).map((p) => (
            <button
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-left hover:shadow-md hover:border-indigo-300 transition-all"
              onClick={() =>
                router.emit("view-product", { productId: p.id })
              }
            >
              <span className="font-medium text-gray-900">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
