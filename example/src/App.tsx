import { observer } from "mobx-react-lite";
import { router } from "./router";
import { Navigation } from "./components/Navigation";
import { LoadingOverlay } from "./components/LoadingOverlay";
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
      case "home":
        return <HomePage />;
      case "about":
        return <AboutPage />;
      case "products":
        return <ProductsPage />;
      case "product-detail":
        return <ProductDetailPage />;
      case "contact":
        return <ContactPage />;
      case "react-integration":
        return <ReactIntegrationPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay />
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
