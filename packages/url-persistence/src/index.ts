import {
  createHashHistory,
  History,
  Location,
  LocationListener
} from 'history';
import { parse, stringify } from 'query-string';
import { States } from './persistence';

const sanitize = (object): object => {
  const keys = Object.keys(object);
  const result = {};
  keys.forEach(key => {
    if (object[key] != null) {
      result[key] = object[key];
    }
  });

  return result;
};

export interface CurrentState {
  name: string;
  params: queryString.ParsedQuery;
}

class URLPersistence {
  _history: History = <History>{};

  listen = (listener: LocationListener<any>) => {};

  _location: Location = <Location>{};

  _testURL: string = '';

  constructor(history: History = <History>createHashHistory()) {
    this._updateLocation = this._updateLocation.bind(this);
    this._history = history;
    this.listen = this._history.listen.bind(this);
    this._history.listen(this._updateLocation);
    this._updateLocation(this._history.location);
  }

  // @action.bound
  _updateLocation(location: Location) {
    this._location = location;
  }

  //  @computed
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
