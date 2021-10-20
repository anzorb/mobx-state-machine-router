import { createHashHistory, Location } from 'history';
import { parse, ParsedQuery } from 'query-string';
import { action, observable, toJS } from 'mobx';
import { IPersistence, IStates } from '../../core/src';

export interface ICurrentState {
  name: string;
  params: ParsedQuery;
}

export interface ISerializers {
  [key: string]: {
    getter?: (value: string) => any;
    setter?: (value: any) => string;
  };
}

const deserialize = (params, serializers: ISerializers | undefined): object => {
  const paramsObject = {};
  Object.keys(params).forEach((key) => {
    if (
      serializers != null &&
      serializers[key] != null &&
      typeof serializers[key].getter === 'function'
    ) {
      try {
        paramsObject[key] = serializers[key].getter!(params[key]);
      } catch (err: any) {
        throw new Error(err);
      }
    } else {
      paramsObject[key] = params[key];
    }
  });
  return paramsObject;
};

const serialize = (params, serializers: ISerializers | undefined): string => {
  let paramsString: string = '';
  Object.keys(params).forEach((key) => {
    if (params[key] == null) {
      return;
    }
    if (
      serializers != null &&
      serializers[key] != null &&
      typeof serializers[key].setter === 'function'
    ) {
      try {
        paramsString += `${key}=${serializers[key].setter!(params[key])}&`;
      } catch (err: any) {
        throw new Error(err);
      }
    } else {
      paramsString += `${key}=${encodeURIComponent(params[key])}&`;
    }
  });

  paramsString = paramsString.substr(0, paramsString.length - 1);
  return paramsString;
};

export type LikeHistoryInterface = {
  push(options: { pathname: string; search?: string }): void;
  listen(fn: (update: { location: Location }) => void): void;
  location: Location;
};

const URLPersistence = (options?: {
  serializers?: ISerializers;
  history?: LikeHistoryInterface;
}) => {
  const historyObject = options?.history || createHashHistory();

  const setStateFromLocation = action((location: Location) => {
    const params = parse(location.search);
    const name = decodeURIComponent(location.pathname);
    const paramsObject = deserialize(params, options?.serializers);
    API.currentState = { name, params: paramsObject };
  });

  const API: IPersistence = observable(
    {
      currentState: {
        name: '',
        params: {},
      },
      write: function write(currentState: ICurrentState, states: IStates) {
        const name = states[currentState.name].url;
        const params = { ...toJS(currentState.params) };
        const paramsString: string = serialize(params, options?.serializers);

        const toURL = `${name}${paramsString !== '' ? `?${paramsString}` : ''}`;
        if (window.location.href.split('#')[1] !== toURL) {
          historyObject.push({
            pathname: name!,
            search: paramsString !== '' ? `?${paramsString}` : '',
          });
        }
      },
    },
    {},
    { deep: false }
  );

  historyObject.listen((update) => {
    setStateFromLocation(update.location);
  });

  setStateFromLocation(historyObject.location);

  return API;
};
export default URLPersistence;
