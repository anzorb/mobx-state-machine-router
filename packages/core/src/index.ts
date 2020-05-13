import { observable, action, computed, extendObservable, toJS } from 'mobx';

const transition = (
  states: IStates,
  curState: string,
  actionName: string
): string => {
  const result = states[curState].actions[actionName];

  return result;
};

export interface IWriteFn {
  (currentState: ICurrentState, states: IStates);
}

interface IListenFnParam {}

export interface IListenFn {
  //(myArgument: IListenFnParam): ICurrentState;
  (argumeny: any): any;
}

export interface IPersistence {
  currentState: ICurrentState;
  write: IWriteFn;
  listen?: IListenFn;
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

export interface IParams {
  states: IStates;
  startState?: string;
  query?: IQuery;
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
  readonly state: string;
  currentState: ICurrentState;
  emit: (actionName: string, params?: object) => void;
  persistence: IPersistence;
}

class MobxStateMachineRouter implements IMobxStateMachineRouter {
  @observable.ref currentState = <ICurrentState>{
    name: '',
    params: <object>{}
  };

  persistence = <IPersistence>{};

  _startState: string = 'HOME';

  _startParams: IQuery = <IQuery>{};

  _stateHistory: ICurrentState[] = <ICurrentState[]>[];

  _states: IStates = <IStates>{};

  _reverseRoutes: IReverseRoutes = <IReverseRoutes>{};

  @computed
  get state() {
    return this.currentState.name;
  }

  @action.bound
  _setCurrentState(newState: ICurrentState) {
    const _newStateName = newState.name;
    if (typeof this._states[_newStateName] !== 'undefined') {
      const params = { ...newState.params };
      // update/remove existing props
      for (const key in toJS(this.currentState.params)) {
        this.currentState.params[key] = params[key];

        delete params[key];
      }
      // add new props
      for (const key in params) {
        extendObservable(this.currentState.params, {
          [key]: params[key]
        });
      }

      // only update the whole object if a new State exists
      if (this.currentState.name !== _newStateName) {
        const newState = {
          name: _newStateName,
          params: this.currentState.params
        };
        this.currentState = newState;
        this._stateHistory.push(newState);
      }
    } else {
      const newState = {
        name: Object.keys(this._states)[0],
        params: this.currentState.params
      };

      this.currentState = newState;
      this._stateHistory.push(newState);
    }
  }

  emit(actionName: string, query: object = {}) {
    let newState;
    let newParams = {};

    // determine new state to transition to
    if (actionName === 'goBack' && this._stateHistory.length > 3) {
      const newStateObject: ICurrentState = this._stateHistory[
        this._stateHistory.length - 2
      ];
      newState = newStateObject.name;
      newParams = newStateObject.params;

      this._stateHistory.splice(this._stateHistory.length - 2, 2);
    } else {
      // determine new state to transition to
      newState = transition(this._states, this.state, actionName);
      newParams = { ...query };
    }

    if (newState != null) {
      // if a persistence layer exists, write to it, and expect to resolve internal state as a result
      if (typeof this.persistence.write === 'function') {
        this.persistence.write(
          {
            name: newState,
            params: newParams
          },
          this._states
        );
      } else {
        this._setCurrentState({
          name: newState,
          params: newParams
        });
      }
    }
  }

  constructor({
    states,
    startState = 'HOME',
    query = {},
    persistence
  }: IParams) {
    this._states = states;
    this._startState = startState;
    this._startParams = query;

    if (persistence != null) {
      this.persistence = persistence;
    }
    this.emit = this.emit.bind(this);

    // add new props
    for (const key in query) {
      extendObservable(this.currentState.params, {
        [key]: query[key]
      });
    }

    // subscribe to persistence and set currentState
    if (this.persistence && this.persistence.currentState != null) {
      for (const i in states) {
        const route = states[i].url;
        this._reverseRoutes[route!.toLowerCase()] = i;
      }

      if (typeof this.persistence.listen === 'function') {
        this.persistence.listen(() => {
          const { name, params } = this.persistence.currentState;
          const route = this._reverseRoutes[name];
          if (route != null) {
            this._setCurrentState({
              params: { ...params },
              name: route
            });
          }
        });
      }
      const route = this._reverseRoutes[this.persistence.currentState.name];
      if (route != null) {
        this._setCurrentState({
          params: { ...this.persistence.currentState.params },
          name: route
        });
      } else {
        // ignore invalid starting URLs and params
        this._setCurrentState({
          name: startState,
          params: query
        });
      }
    } else {
      this._setCurrentState({
        name: startState,
        params: query
      });
    }
  }
}
export default MobxStateMachineRouter;
