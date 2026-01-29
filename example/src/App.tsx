import { observer } from "mobx-react-lite";
import { router, STATE } from "./router";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./components/pages/HomePage";
import { AboutPage } from "./components/pages/AboutPage";
import { ProductsPage } from "./components/pages/ProductsPage";
import { ProductDetailPage } from "./components/pages/ProductDetailPage";
import { ContactPage } from "./components/pages/ContactPage";
import { ReactIntegrationPage } from "./components/pages/ReactIntegrationPage";

const App = observer(() => {
  const currentState = router.currentState.name;

  const renderPage = () => {
    switch (currentState) {
      case STATE.HOME:
        return <HomePage />;
      case STATE.ABOUT:
        return <AboutPage />;
      case STATE.PRODUCTS:
        return <ProductsPage />;
      case STATE.PRODUCT_DETAIL:
        return <ProductDetailPage />;
      case STATE.CONTACT:
        return <ContactPage />;
      case STATE.REACT_INTEGRATION:
        return <ReactIntegrationPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{renderPage()}</main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            MobX State Machine Router Demo •{" "}
            <a
              href="https://github.com/anzorb/mobx-state-machine-router"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
});

export default App;
