import queryString from 'query-string';
import { observable, action, computed, extendObservable, toJS } from 'mobx';
import { createHashHistory } from 'history';
import { sanitize, transition } from './utils';

class MobxStateMachineRouter {
  @observable _location = null;

  _reverseRoutes = {};

  @observable.ref _history = null;

  @observable.ref query = {};

  @observable state = null;

  @action _setState(state) {
    this.state = state;
  }

  @action
  _setQuery(query) {
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
    const newState = transition(this._states, this.state, actionName);
    if (actionName === 'error') {
      this._setState(newState);
      this._history.replace('/');
      // TODO: DANGER: this can get stuck in a reload loop > need to guard + report errors
      window.location.reload();

      return;
    }

    if (newState != null) {
      this._setQuery({ ...this.query, ...query });
      if (newState !== 'noop') {
        this._setState(newState);
      }
      const toURL = `${this._states[this.state].url}?${this.queryURL}`;
      // prevent pushing the same path
      if (`${this._location.pathname}${this._location.search}` !== toURL) {
        this._history.push(toURL);
      }
    }
  }

  constructor({
    states,
    startState,
    query = {},
    history = createHashHistory()
  }) {
    this._parseURL = this._parseURL.bind(this);
    for (const key in query) {
      extendObservable(this.query, {
        [key]: query[key]
      });
    }

    this._states = states;
    this._setState(startState);
    this.emit = this.emit.bind(this);

    for (const i in states) {
      const route = this._states[i].url;
      this._reverseRoutes[route] = i;
    }
    this._setHistory(history);
    this._setLocation(this._history.location);

    this._setState(this._reverseRoutes[this._location.pathname]);
    this._setQuery(queryString.parse(this._location.search));

    this._history.listen(this._parseURL);
  }

  _parseURL(location) {
    this._setLocation(location);
    this._setState(this._reverseRoutes[location.pathname]);
  }

  @action
  _setLocation(location) {
    this._location = location;
  }

  @action
  _setHistory(history) {
    this._history = history;
  }
}
export default MobxStateMachineRouter;
