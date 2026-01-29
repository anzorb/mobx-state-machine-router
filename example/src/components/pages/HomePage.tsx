import { router } from "../../router";

export const HomePage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to the MobX State Machine Router Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          This example demonstrates how to use{" "}
          <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600">
            @mobx-state-machine-router
          </code>{" "}
          with URL persistence and hash routing to create a multi-page React
          application.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">🔄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            State Machine Routing
          </h3>
          <p className="text-gray-600">
            Navigation is controlled by a state machine. Each page is a state,
            and navigation happens through actions.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">🔗</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            URL Persistence
          </h3>
          <p className="text-gray-600">
            The current state is automatically synced with the URL hash. Try
            refreshing the page or using browser back/forward!
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Query Parameters
          </h3>
          <p className="text-gray-600">
            Pass data between states using query parameters. Check out the
            Products page to see this in action.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            MobX Reactivity
          </h3>
          <p className="text-gray-600">
            Built on MobX observables for efficient, fine-grained reactivity.
            Components only re-render when their observed data changes.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Get Started</h2>
        <div className="flex justify-center gap-4">
          <button
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            onClick={() => router.emit("go-products")}
          >
            Browse Products
          </button>
          <button
            className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
            onClick={() => router.emit("go-about")}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};
