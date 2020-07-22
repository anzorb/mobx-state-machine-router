import {
  action,
  observable,
  observe,
  Lambda,
  autorun,
  IValueDidChange,
} from 'mobx';

export interface IWriteFn {
  (currentState: ICurrentState, states: IStates);
}

export interface IPersistence {
  currentState: ICurrentState;
  write: IWriteFn;
}

export interface IActions {
  [actionName: string]: string;
}

export interface IState {
  actions: IActions;
  url?: string;
}

export interface IStates {
  [stateName: string]: IState;
}

export interface IQuery {
  [param: string]: any;
}

export interface IMobxStateMachineRouterParams {
  states: IStates;
  currentState?: {
    name?: string;
    params?: IQuery;
  };
  persistence?: IPersistence;
}

export interface IReverseRoutes {
  [param: string]: string;
}

export interface ICurrentState {
  name: string;
  params: IQuery;
}

export interface IMobxStateMachineRouter {
  currentState: ICurrentState;
  emit: (actionName: string, params?: object) => void;
  destroy: () => void;
}

const transition = (
  states: IStates,
  curState: string,
  actionName: string
): string => {
  const result = states[curState].actions[actionName];

  return result;
};

type TObserveParam = (
  object: IMobxStateMachineRouter,
  property: 'currentState',
  paramName: string,
  listener: (change: IValueDidChange<ICurrentState>) => void
) => Lambda;

export const observeParam: TObserveParam = (
  object,
  property,
  paramName,
  listener
) => {
  return observe(object, property, (change) => {
    const { newValue, oldValue } = change;
    if (newValue.params[paramName] !== oldValue?.params[paramName]) {
      listener(change);
    }
  });
};

const MobxStateMachineRouter = ({
  states,
  currentState = {
    name: 'HOME',
    params: {},
  },
  persistence,
}: IMobxStateMachineRouterParams) => {
  const reverseRoutes: IReverseRoutes = {} as IReverseRoutes;

  const setCurrentState = action((newState: ICurrentState) => {
    API.currentState = {
      name: states[newState.name]
        ? newState.name
        : API.currentState.name || Object.keys(states)[0],
      params: newState.params,
    };
  });

  const API: IMobxStateMachineRouter = observable(
    {
      currentState: {
        name:
          currentState.name != null &&
          Object.keys(states).includes(currentState.name)
            ? currentState.name
            : Object.keys(states)[0],
        params: currentState.params || {},
      },
      emit: action((actionName: string, params: object = {}) => {
        let newState;
        let newParams = {};
        // determine new state to transition to
        newState = transition(states, API.currentState.name, actionName);
        newParams = { ...params };

        if (newState != null) {
          setCurrentState({
            name: newState,
            params: newParams,
          });
        }
      }),
      destroy() {
        return void 0;
      },
    },
    {},
    { deep: false }
  );

  // subscribe to persistence and set currentState
  if (persistence && persistence.currentState != null) {
    for (const stateName of Object.keys(states)) {
      const route = states[stateName].url;
      reverseRoutes[route!.toLowerCase()] = stateName;
    }

    const cleanUpAutorun = autorun(
      () => {
        const { name, params } = persistence.currentState;
        const route = reverseRoutes[name];
        if (route != null) {
          setCurrentState({
            name: route,
            params,
          });
        }
      },
      { name: 'persistence-listener' }
    );

    const cleanUpObserve = observe(API, 'currentState', ({ newValue }) => {
      // if a persistence layer exists, write to it, and expect to resolve internal state as a result
      if (typeof persistence.write === 'function') {
        persistence.write(newValue, states);
      }
    });

    API.destroy = () => {
      cleanUpObserve();
      cleanUpAutorun();
    };
  } else {
    setCurrentState({
      name: currentState.name || Object.keys(states)[0],
      params: currentState.params || {},
    });
  }

  return API;
};

export default MobxStateMachineRouter;
