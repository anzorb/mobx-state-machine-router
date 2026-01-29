import MobxStateMachineRouter, {
  TStates,
} from "@mobx-state-machine-router/core";
import URLPersistence from "@mobx-state-machine-router/url-persistence";
import { observable, action } from "mobx";
import interceptAsync from "mobx-async-intercept";

// Define the possible states (pages) in our app
export enum STATE {
  HOME = "HOME",
  ABOUT = "ABOUT",
  PRODUCTS = "PRODUCTS",
  PRODUCT_DETAIL = "PRODUCT_DETAIL",
  CONTACT = "CONTACT",
  REACT_INTEGRATION = "REACT_INTEGRATION",
}

// Define the possible actions (navigation events)
export enum ACTION {
  goHome = "goHome",
  goAbout = "goAbout",
  goProducts = "goProducts",
  viewProduct = "viewProduct",
  goContact = "goContact",
  goReactIntegration = "goReactIntegration",
}

// Define the params that can be passed between states
export type RouterParams = {
  productId?: string;
  category?: string;
  search?: string;
};

// Define the state machine configuration
// Each state has a list of actions and the state they transition to
export const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: {
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.goContact]: STATE.CONTACT,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION,
    },
    url: "/",
  },
  [STATE.ABOUT]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.goContact]: STATE.CONTACT,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION,
    },
    url: "/about",
  },
  [STATE.PRODUCTS]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS, // Self-transition to update params
      [ACTION.viewProduct]: STATE.PRODUCT_DETAIL,
      [ACTION.goContact]: STATE.CONTACT,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION,
    },
    url: "/products",
  },
  [STATE.PRODUCT_DETAIL]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.viewProduct]: STATE.PRODUCT_DETAIL, // Can navigate to another product
      [ACTION.goContact]: STATE.CONTACT,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION,
    },
    url: "/product",
  },
  [STATE.CONTACT]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION,
    },
    url: "/contact",
  },
  [STATE.REACT_INTEGRATION]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.goContact]: STATE.CONTACT,
      [ACTION.goReactIntegration]: STATE.REACT_INTEGRATION, // Self-transition for params
    },
    url: "/react-integration",
  },
};

// Create URL persistence layer with hash routing
const persistence = URLPersistence<STATE, RouterParams, ACTION>();

// Create the router instance
export const router = MobxStateMachineRouter<STATE, RouterParams, ACTION>({
  states,
  currentState: {
    name: STATE.HOME,
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
  if (change.newValue.name === STATE.PRODUCT_DETAIL) {
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
