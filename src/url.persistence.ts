import { createHashHistory, History, Location } from 'history';
import { computed, action, observable } from 'mobx';
import { sanitize } from './utils';
import { States } from '.';

const { parse, stringify } = require('query-string');

export interface CurrentState {
  name: string;
  params: queryString.ParsedQuery;
}

class URLPersistence {
  _history: History = <History>{};

  @observable _location: Location = <Location>{};

  _testURL: string = '';

  constructor(history: History = <History>createHashHistory()) {
    this._history = history;
    this._history.listen(this._updateLocation);
    this._updateLocation(this._history.location);
  }

  @action.bound
  _updateLocation(location: Location) {
    this._location = location;
  }

  @computed
  get currentState(): CurrentState {
    const params = parse(this._location.search);
    const name = decodeURIComponent(this._location.pathname);

    return { name, params };
  }

  write(currentState: CurrentState, states: States) {
    const name = states[currentState.name].url;
    const params = sanitize(currentState.params);
    const paramsString = stringify(params);

    const toURL = `${name}${paramsString !== '' ? `?${paramsString}` : ''}`;
    this._history.push(toURL);
    this._testURL = `#${toURL}`;
  }
}

export default URLPersistence;
