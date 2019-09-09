export const sanitize = object => {
  const keys = Object.keys(object);
  const result = {};
  keys.forEach(key => {
    if (object[key] != null) {
      result[key] = object[key];
    }
  });

  return result;
};

export const transition = (states, curState, actionName) => {
  const result = states[curState].actions[actionName];

  if (result == null) {
    console.warn('no state for action ', curState, actionName);
  } else if (curState !== result) {
    console.log('STATE MACHINE: ', curState, actionName, result);
  }

  return result;
};
