import MobxStateMachineRouter, {
  TStates,
} from "@mobx-state-machine-router/core";
import URLPersistence from "@mobx-state-machine-router/url-persistence";
import { observable, action } from "mobx";
import interceptAsync from "mobx-async-intercept";

// Define the possible states (pages) using string literal types
export type State =
  | "home"
  | "about"
  | "products"
  | "product-detail"
  | "contact"
  | "react-integration";

// Define the possible actions (navigation events) using string literal types
export type Action =
  | "go-home"
  | "go-about"
  | "go-products"
  | "view-product"
  | "go-contact"
  | "go-react-integration";

// Define the params that can be passed between states
export type RouterParams = {
  productId?: string;
  categories?: string[]; // Array of selected categories
  search?: string;
};

// Define the state machine configuration
// Each state has a list of actions and the state they transition to
export const states: TStates<State, Action> = {
  home: {
    actions: {
      "go-about": "about",
      "go-products": "products",
      "go-contact": "contact",
      "go-react-integration": "react-integration",
    },
    url: "/",
  },
  about: {
    actions: {
      "go-home": "home",
      "go-products": "products",
      "go-contact": "contact",
      "go-react-integration": "react-integration",
    },
    url: "/about",
  },
  products: {
    actions: {
      "go-home": "home",
      "go-about": "about",
      "go-products": "products", // Self-transition to update params
      "view-product": "product-detail",
      "go-contact": "contact",
      "go-react-integration": "react-integration",
    },
    url: "/products",
  },
  "product-detail": {
    actions: {
      "go-home": "home",
      "go-about": "about",
      "go-products": "products",
      "view-product": "product-detail", // Can navigate to another product
      "go-contact": "contact",
      "go-react-integration": "react-integration",
    },
    url: "/product",
  },
  contact: {
    actions: {
      "go-home": "home",
      "go-about": "about",
      "go-products": "products",
      "go-react-integration": "react-integration",
    },
    url: "/contact",
  },
  "react-integration": {
    actions: {
      "go-home": "home",
      "go-about": "about",
      "go-products": "products",
      "go-contact": "contact",
      "go-react-integration": "react-integration", // Self-transition for params
    },
    url: "/react-integration",
  },
};

// Create URL persistence layer with hash routing and custom serializers
const persistence = URLPersistence<State, RouterParams, Action>({
  serializers: {
    // Custom serializer for array params - demonstrates array URL support
    categories: {
      getter: (value: string) => value.split(","),
      setter: (value: string[]) => value.join(","),
    },
  },
});

// Create the router instance
export const router = MobxStateMachineRouter<State, RouterParams, Action>({
  states,
  currentState: {
    name: "home",
    params: {},
  },
  persistence,
});

// Helper type for the router
export type Router = typeof router;

// Loading state for async transitions
export const loadingState = observable({
  isLoading: false,
  message: "",
  setLoading: action((loading: boolean, message = "") => {
    loadingState.isLoading = loading;
    loadingState.message = message;
  }),
});

// Simulate fetching product data with a delay
const fetchProductData = (productId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetched product ${productId}`);
      resolve();
    }, 1500); // 1.5 second delay to simulate API call
  });
};

// Async intercept for product detail page - shows loading spinner
interceptAsync(router, "currentState", async (change) => {
  if (change.newValue.name === "product-detail") {
    const productId = change.newValue.params?.productId;

    // Show loading spinner
    loadingState.setLoading(true, `Loading product ${productId}...`);

    try {
      // Simulate async data fetch
      await fetchProductData(productId || "unknown");
    } finally {
      // Hide loading spinner
      loadingState.setLoading(false);
    }
  }

  return change;
});
