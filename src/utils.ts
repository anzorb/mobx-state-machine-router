import { States } from './index';

export const sanitize = (object): object => {
  const keys = Object.keys(object);
  const result = {};
  keys.forEach(key => {
    if (object[key] != null) {
      result[key] = object[key];
    }
  });

  return result;
};

export const transition = (
  states: States,
  curState: string,
  actionName: string
): string => {
  const result = states[curState].actions[actionName];

  return result;
};
