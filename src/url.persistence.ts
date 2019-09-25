import * as queryString from 'query-string';
import { createHashHistory, History, Location } from 'history';
import { computed, action } from 'mobx';
import { sanitize } from './utils';

export interface CurrentState {
  name: string;
  params: queryString.ParsedQuery;
}

class URLPersistence {
  _history: History = <History>{};

  _location: Location = <Location>{};

  _testURL: string = '';

  constructor(history: History = <History>createHashHistory()) {
    this._history = history;
    this._history.listen(this._updateLocation);
  }

  @action.bound
  _updateLocation(location: Location) {
    this._location = location;
  }

  @computed
  get currentState(): CurrentState {
    const params = queryString.parse(this._location.search);
    const name = decodeURIComponent(this._location.pathname);

    return { name, params };
  }

  write(currentState: CurrentState) {
    const name = encodeURIComponent(currentState.name.toLowerCase());
    const params = sanitize(currentState.params);
    const paramsString = queryString.stringify(params);

    const toURL = `${name}${paramsString !== '' ? `?${paramsString}` : ''}`;
    this._history.push(toURL);
    this._testURL = `#/${toURL}`;
  }
}

export default URLPersistence;
