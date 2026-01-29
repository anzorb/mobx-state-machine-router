import { observer } from "mobx-react-lite";
import { router, STATE, ACTION } from "../router";

export const Navigation = observer(() => {
  const currentState = router.currentState.name;

  const navButtonClass = (state: STATE) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      currentState === state
        ? "bg-indigo-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔀</span>
          <span className="font-bold text-gray-900">MobX Router Demo</span>
        </div>

        <ul className="flex items-center gap-2">
          <li>
            <button
              className={navButtonClass(STATE.HOME)}
              onClick={() => router.emit(ACTION.goHome)}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={navButtonClass(STATE.ABOUT)}
              onClick={() => router.emit(ACTION.goAbout)}
            >
              About
            </button>
          </li>
          <li>
            <button
              className={navButtonClass(STATE.PRODUCTS)}
              onClick={() => router.emit(ACTION.goProducts)}
            >
              Products
            </button>
          </li>
          <li>
            <button
              className={navButtonClass(STATE.REACT_INTEGRATION)}
              onClick={() => router.emit(ACTION.goReactIntegration)}
            >
              React Integration
            </button>
          </li>
          <li>
            <button
              className={navButtonClass(STATE.CONTACT)}
              onClick={() => router.emit(ACTION.goContact)}
            >
              Contact
            </button>
          </li>
        </ul>

        <div className="text-sm text-gray-500">
          State: <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600 font-mono">{currentState}</code>
        </div>
      </div>
    </nav>
  );
});
