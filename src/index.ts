import {
  observable,
  action,
  computed,
  extendObservable,
  toJS,
  observe
} from 'mobx';
import { transition } from './utils';
import { Persistence } from './persistence';

interface Actions {
  [actionName: string]: string;
}

interface State {
  actions: Actions;
  url: string;
}

export interface States {
  [stateName: string]: State;
}

interface Query {
  [param: string]: string | number;
}

interface Params {
  states: States;
  startState: string;
  query: Query;
  persistence?: Persistence;
}

interface ReverseRoutes {
  [param: string]: string;
}

interface CurrentState {
  name: string;
  params: object;
}

class MobxStateMachineRouter {
  @observable currentState: CurrentState = <CurrentState>{
    name: '',
    params: <object>{}
  };

  persistence: Persistence = <Persistence>{};

  _startState: string = 'HOME';

  _states: States = <States>{};

  _reverseRoutes: ReverseRoutes = <ReverseRoutes>{};

  @computed
  get state(): string {
    return this.currentState.name;
  }

  @action.bound
  _setCurrentState(newState: CurrentState) {
    const _newStateName = newState.name;
    if (typeof this._states[_newStateName] !== 'undefined') {
      // validate that new state name exists in state map
      // if persistence exists, write to it
      this._setParams({ ...this.currentState.params, ...newState.params });
      this.currentState = {
        name: _newStateName,
        params: this.currentState.params
      };
    } else if (this.currentState.name === '') {
      this.currentState = {
        name: Object.keys(this._states)[0],
        params: this.currentState.params
      };
    }
  }

  @action
  _setParams(query: object) {
    for (const key in toJS(this.currentState.params)) {
      if (typeof query[key] !== 'undefined') {
        this.currentState.params[key] = query[key];
        delete query[key];
      }
    }
    for (const key in query) {
      extendObservable(this.currentState.params, {
        [key]: query[key]
      });
    }
  }

  emit(actionName: string, query: object = {}) {
    // determine new state to transition to
    const newState = transition(this._states, this.state, actionName);

    if (newState != null) {
      // if a persistence layer exists, write to it, and expect to resolve internal state as a result
      if (typeof this.persistence.write === 'function') {
        this.persistence.write({
          name: newState,
          params: { ...this.currentState.params, ...query }
        });
      } else {
        this._setCurrentState({
          name: newState,
          params: query
        });
      }
    }
  }

  constructor({
    states,
    startState = 'HOME',
    query = {},
    persistence
  }: Params) {
    this._states = states;
    this._startState = startState;
    if (persistence != null) {
      this.persistence = persistence;
    }
    this.emit = this.emit.bind(this);

    // set initial query
    this._setParams(query);

    for (const i in states) {
      const route = states[i].url;
      this._reverseRoutes[route.toLowerCase()] = i;
    }
    // subscribe to persistence and set currentState
    if (this.persistence.currentState != null) {
      observe(this.persistence, 'currentState', ({ newValue }) => {
        const route = this._reverseRoutes[newValue.name];
        if (route != null) {
          this._setCurrentState({ ...newValue, name: route });
        }
      });
    }

    this._setCurrentState({
      name: startState,
      params: this.currentState.params
    });
  }
}
export default MobxStateMachineRouter;
