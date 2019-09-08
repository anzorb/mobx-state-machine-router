import queryString from 'query-string';
import { observable, action, computed, extendObservable, toJS } from 'mobx';
import { createHashHistory } from 'history';
import { sanitize } from './utils';

const transition = (states, curState, actionName) => {
  const result = states[curState].actions[actionName];

  if (result == null) {
    console.warn('no state for action ', curState, actionName);
  } else if (curState !== result) {
    console.log('STATE MACHINE: ', curState, actionName, result);
  }

  return result;
};

class MobxStateMachineRouter {
  @observable location = null;

  reverseRoutes = {};

  @observable.ref history = null;

  @observable.ref query = {};

  @observable state = null;

  @action setState(state) {
    this.state = state;
  }

  @action
  setQuery(query) {
    for (const key in toJS(this.query)) {
      if (typeof query[key] !== 'undefined') {
        this.query[key] = query[key];
        delete query[key];
      }
    }
    for (const key in query) {
      extendObservable(this.query, {
        [key]: query[key]
      });
    }
  }

  @computed
  get queryURL() {
    const query = sanitize(this.query);
    const string = queryString.stringify(query);

    return string;
  }

  @computed
  get queryJSON() {
    return this.query;
  }

  emit(actionName, query) {
    const newState = transition(this.states, this.state, actionName);
    if (actionName === 'error') {
      this.setState(newState);
      this.history.replace('/');
      // TODO: DANGER: this can get stuck in a reload loop > need to guard + report errors
      window.location.reload();

      return;
    }

    if (newState != null) {
      this.setQuery({ ...this.query, ...query });
      if (newState !== 'noop') {
        this.setState(newState);
      }
      const toURL = `${this.states[this.state].url}?${this.queryURL}`;
      // prevent pushing the same path
      if (`${this.location.pathname}${this.location.search}` !== toURL) {
        this.history.push(toURL);
        document.title = this.state;
      }
    }
  }

  constructor({
    states,
    startState,
    query = {},
    history = createHashHistory()
  }) {
    for (const key in query) {
      extendObservable(this.query, {
        [key]: query[key]
      });
    }

    this.states = states;
    this.setState(startState);
    this.emit = this.emit.bind(this);

    for (const i in states) {
      const route = this.states[i].url;
      this.reverseRoutes[route] = i;
    }

    this.setHistory(history);
    this.setLocation(this.history.location);

    this.setState(this.reverseRoutes[this.location.pathname]);
    this.setQuery(queryString.parse(this.location.search));

    this.history.listen(location => {
      this.setLocation(location);
      this.setState(this.reverseRoutes[location.pathname]);
    });
  }

  @action
  setLocation(location) {
    this.location = location;
  }

  @action
  setHistory(history) {
    this.history = history;
  }
}
export default MobxStateMachineRouter;
