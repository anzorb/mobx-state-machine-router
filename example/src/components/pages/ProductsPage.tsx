import { observer } from "mobx-react-lite";
import { router, ACTION } from "../../router";

const products = [
  { id: "1", name: "State Machine Router", price: "Free", category: "routing" },
  { id: "2", name: "MobX Core", price: "Free", category: "state" },
  { id: "3", name: "React Integration", price: "Free", category: "framework" },
  { id: "4", name: "URL Persistence", price: "Free", category: "routing" },
  { id: "5", name: "TypeScript Support", price: "Free", category: "tooling" },
  { id: "6", name: "Hash Routing", price: "Free", category: "routing" },
];

const categories = ["all", "routing", "state", "framework", "tooling"];

export const ProductsPage = observer(() => {
  const currentCategory = router.currentState.params.category || "all";
  const searchTerm = router.currentState.params.search || "";

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      currentCategory === "all" || product.category === currentCategory;
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (category: string) => {
    router.emit(ACTION.goProducts, {
      ...router.currentState.params,
      category: category === "all" ? undefined : category,
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.emit(ACTION.goProducts, {
      ...router.currentState.params,
      search: e.target.value || undefined,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
      <p className="text-gray-600 mb-8">
        This page demonstrates query parameters. Filter and search - watch the
        URL update!
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    currentCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Current URL params: </span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-indigo-600">
            {JSON.stringify(router.currentState.params)}
          </code>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {product.name}
              </h3>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded capitalize">
                {product.category}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-4">
              {product.price}
            </p>
            <button
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              onClick={() =>
                router.emit(ACTION.viewProduct, { productId: product.id })
              }
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 mb-4">
            No products found matching your criteria.
          </p>
          <button
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            onClick={() => router.emit(ACTION.goProducts, {})}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
});
