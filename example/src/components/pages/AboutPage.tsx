export const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About This Demo</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-gray-600 mb-4">
          The MobX State Machine Router uses a finite state machine to manage
          navigation. Instead of defining routes as URL patterns, you define:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
          <li>
            <strong className="text-gray-900">States</strong> - The pages/views
            in your application
          </li>
          <li>
            <strong className="text-gray-900">Actions</strong> - The events that
            trigger navigation
          </li>
          <li>
            <strong className="text-gray-900">Transitions</strong> - Which
            actions lead to which states
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          State Machine Definition
        </h2>
        <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm">
          <code>{`const states = {
  HOME: {
    actions: {
      goAbout: "ABOUT",
      goProducts: "PRODUCTS",
    },
    url: "/",
  },
  ABOUT: {
    actions: {
      goHome: "HOME",
      goProducts: "PRODUCTS",
    },
    url: "/about",
  },
  // ... more states
};`}</code>
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Benefits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Predictable Navigation
            </h3>
            <p className="text-gray-600">
              The state machine ensures only valid transitions are possible. You
              can't navigate to a page that isn't defined as a valid transition
              from the current state.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy to Test
            </h3>
            <p className="text-gray-600">
              State machines are inherently testable. You can verify all
              possible transitions and states without running the full app.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              URL Sync
            </h3>
            <p className="text-gray-600">
              The URL persistence layer keeps the browser URL in sync with the
              current state, enabling deep linking and browser history.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              MobX Integration
            </h3>
            <p className="text-gray-600">
              Built on MobX, you can observe state changes and react to them
              anywhere in your application.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
