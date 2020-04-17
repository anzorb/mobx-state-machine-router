import {
  createHashHistory,
  History,
  Location,
  LocationListener
} from 'history';
import { parse, stringify, ParsedQuery } from 'query-string';
import { IStates, IPersistence } from '../../core/src';

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

export interface ICurrentState {
  name: string;
  params: ParsedQuery;
}

class URLPersistence implements IPersistence {
  _history: History = <History>{};

  listen: (listener: LocationListener<any>) => void;

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
  get currentState(): ICurrentState {
    const params = parse(this._location.search);
    const name = decodeURIComponent(this._location.pathname);

    return { name, params };
  }

  write(currentState: ICurrentState, states: IStates) {
    const name = states[currentState.name].url;
    const params = sanitize(currentState.params);
    const paramsString = stringify(params);

    const toURL = `${name}${paramsString !== '' ? `?${paramsString}` : ''}`;
    this._history.push(toURL);
    this._testURL = `#${toURL}`;
  }
}

export default URLPersistence;
