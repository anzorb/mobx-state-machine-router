import MobxStateMachineRouter, {
  TStates,
} from "@mobx-state-machine-router/core";
import URLPersistence from "@mobx-state-machine-router/url-persistence";

// Define the possible states (pages) in our app
export enum STATE {
  HOME = "HOME",
  ABOUT = "ABOUT",
  PRODUCTS = "PRODUCTS",
  PRODUCT_DETAIL = "PRODUCT_DETAIL",
  CONTACT = "CONTACT",
}

// Define the possible actions (navigation events)
export enum ACTION {
  goHome = "goHome",
  goAbout = "goAbout",
  goProducts = "goProducts",
  viewProduct = "viewProduct",
  goContact = "goContact",
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
    },
    url: "/",
  },
  [STATE.ABOUT]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goProducts]: STATE.PRODUCTS,
      [ACTION.goContact]: STATE.CONTACT,
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
    },
    url: "/product",
  },
  [STATE.CONTACT]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.goAbout]: STATE.ABOUT,
      [ACTION.goProducts]: STATE.PRODUCTS,
    },
    url: "/contact",
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
