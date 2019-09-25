import { observable, action, computed, extendObservable, toJS } from 'mobx';
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
    params: {}
  };
  persistence: Persistence = <Persistence>{};
  @observable.ref query: object = {};
  _startState: string = 'HOME';
  _states: States = <States>{};
  _reverseRoutes: ReverseRoutes = <ReverseRoutes>{};

  @computed
  get state() {
    return this.currentState.name;
  }

  @action.bound
  _setCurrentState(newState: CurrentState) {
    let _newStateName = newState.name;

    // validate that new state name exists in state map
    if (typeof this._states[_newStateName] === 'undefined') {
      _newStateName = this._startState;
    }

    this.currentState = { ...newState, name: _newStateName };
    if (typeof this.persistence.write === 'function') {
      const { name, params } = this.currentState;
      this.persistence.write({ name: toJS(name), params: toJS(params) });
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

  emit(actionName: string, query: object) {
    // determine new state to transition to
    const newState = transition(this._states, this.state, actionName);

    // handle error states
    if (actionName === 'error') {
      this._setCurrentState({
        name: newState,
        params: this.currentState.params
      });
      // TODO: handle error state
      return;
    }

    if (newState != null) {
      // update query params
      this._setParams({ ...this.currentState.params, ...query });
      // update state + persist if needed
      this._setCurrentState({
        name: newState === 'noop' ? this.currentState.name : newState,
        params: this.currentState.params
      });
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

    // determine initial state based on
    if (this.persistence.currentState != null) {
      this._setCurrentState(this.persistence.currentState);
    } else {
      this._setCurrentState({
        name: startState,
        params: this.currentState.params
      });
    }

    for (const i in states) {
      const route = states[i].url;
      this._reverseRoutes[route.toLowerCase()] = i;
    }

    // if persistence has a listen function, subscribe
    if (typeof this.persistence.listen === 'function') {
      this.persistence.listen(() => {
        const { name } = this.persistence.currentState;
        const route = this._reverseRoutes[name];
        if (route == null) {
          console.warn(
            'No reverse route found for ',
            name,
            this._reverseRoutes
          );
        } else {
          this._setCurrentState(this.persistence.currentState);
        }
      });
    }
  }
}
export default MobxStateMachineRouter;
