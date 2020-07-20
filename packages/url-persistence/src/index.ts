import { createHashHistory, History, Location } from 'history';
import { parse, ParsedQuery } from 'query-string';
import { observable, toJS } from 'mobx';
import { IPersistence, IStates } from '../../core/src/types';

export interface ICurrentState {
  name: string;
  params: ParsedQuery;
}

export interface ISerializers {
  [key: string]: {
    getter?: (value: string) => any;
    setter?: (value: any) => string;
  };
};

const deserialize = (params, serializers: ISerializers | undefined): object => {
  const paramsObject = {};
  Object.keys(params).forEach(key => {
    if (
           serializers != null &&
            serializers[key] != null &&
            typeof serializers[key].getter === 'function'
          ) {
      try {
        paramsObject[key] = serializers[key].getter!(params[key]);
      } catch(err) {
        throw new Error(err);
      }
    } else {
      paramsObject[key] = decodeURI(params[key]);
    }
  });
  return paramsObject;
}

const serialize = (params, serializers: ISerializers | undefined): string => {
  let paramsString: string = '';
  Object.keys(params).forEach(key => {
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
      } catch(err) {
        throw new Error(err);
      }
    } else {
      paramsString += `${key}=${encodeURI(params[key])}&`;
    }
  });

  paramsString = paramsString.substr(0, paramsString.length - 1);
  return paramsString;
}

const URLPersistence = (
  history: History = createHashHistory() as History,
  options?: { serializers?: ISerializers }
) => {
  const API: IPersistence = observable({
    currentState: {
      name: decodeURIComponent(window.location.pathname),
      params: deserialize(parse(window.location.search), options?.serializers),
    },
    write: function write(currentState: ICurrentState, states: IStates) {
      const name = states[currentState.name].url;
      const params = { ...toJS(currentState.params) };
      const paramsString: string = serialize(params, options?.serializers);

      const toURL = `${name}${paramsString !== '' ? `?${paramsString}` : ''}`;

      if (window.location.hash.split('#')[1] !== toURL) {
        history.push(toURL);
      }
    }
  }, {}, { deep: false });

  history.listen((location: Location) => {
    const params = parse(location.search);
    const name = decodeURIComponent(location.pathname);
    const paramsObject = deserialize(params, options?.serializers);

    API.currentState = { name, params: paramsObject };
  });

  return API;
};
export default URLPersistence;
