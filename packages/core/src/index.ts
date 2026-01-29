import { action, observable, observe, autorun, IValueDidChange } from 'mobx';

export interface IWriteFn<S extends string, P, A extends string> {
  (currentState: ICurrentState<S, P>, states: TStates<S, A>);
}

export interface IPersistence<S extends string, P, A extends string> {
  currentState: ICurrentState<S, P>;
  write: IWriteFn<S, P, A>;
}

export type TStates<E extends string, A extends string> = {
  [name in E]: {
    actions: {
      [action in A]?: E;
    };
    url?: string;
  };
};

export interface IMobxStateMachineRouterParams<
  S extends string,
  P,
  A extends string,
> {
  states: TStates<S, A>;
  currentState?: {
    name?: S;
    params?: P;
  };
  persistence?: IPersistence<S, P, A>;
}

export interface IReverseRoutes {
  [param: string]: string;
}

export interface ICurrentState<S, P> {
  name: S;
  params: P;
}

export interface IMobxStateMachineRouter<S, P, A> {
  currentState: ICurrentState<S, P>;
  emit: (actionName: A, params?: P) => void;
  destroy: () => void;
}

function transition<S extends string, A extends string>(
  states: TStates<S, A>,
  curState: S,
  actionName: A,
) {
  const result = states[curState].actions[actionName];

  return result as S;
}

export function observeParam<S, P, A>(
  object: IMobxStateMachineRouter<S, P, A>,
  property: 'currentState',
  paramName: string,
  listener: (change: IValueDidChange<ICurrentState<S, P>>) => void,
) {
  return observe(object, property, (change) => {
    const { newValue, oldValue } = change;
    if (newValue.params[paramName] !== oldValue?.params[paramName]) {
      listener(change);
    }
  });
}

function MobxStateMachineRouter<S extends string, P, A extends string>({
  states,
  currentState = {
    name: undefined,
    params: undefined,
  },
  persistence,
}: IMobxStateMachineRouterParams<S, P, A>) {
  const reverseRoutes: IReverseRoutes = {} as IReverseRoutes;

  const setCurrentState = action((newState: ICurrentState<S, P>) => {
    API.currentState = {
      name: states[newState.name]
        ? newState.name
        : /* istanbul ignore next */ API.currentState.name ||
          (Object.keys(states)[0] as S),
      params: newState.params,
    };
  });

  const API = observable(
    {
      currentState: {
        name:
          currentState.name != null &&
          Object.keys(states).includes(currentState.name)
            ? currentState.name
            : (Object.keys(states)[0] as S),
        params: currentState.params || ({} as P),
      },
      emit: action((actionName, params) => {
        // determine new state to transition to
        const newState = transition<S, A>(
          states,
          API.currentState.name,
          actionName,
        );
        const newParams = { ...params };

        if (newState != null) {
          setCurrentState({
            name: newState,
            params: newParams as P,
          });
        }
      }),
      destroy() {
        return void 0;
      },
    } as IMobxStateMachineRouter<S, P, A>,
    {},
    { deep: false },
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
            name: route as S,
            params,
          });
        }
      },
      { name: 'persistence-listener' },
    );

    const cleanUpObserve = observe(API, 'currentState', ({ newValue }) => {
      // if a persistence layer exists, write to it, and expect to resolve internal state as a result
      if (typeof persistence.write === 'function') {
        persistence.write(newValue as ICurrentState<S, P>, states);
      }
    });

    API.destroy = () => {
      cleanUpObserve();
      cleanUpAutorun();
      return void 0;
    };
  } else {
    setCurrentState({
      name: currentState.name || (Object.keys(states)[0] as S),
      params: currentState.params || ({} as P),
    });
  }

  return API;
}

export default MobxStateMachineRouter;
