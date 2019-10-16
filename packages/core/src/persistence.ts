interface State {
  actions: Actions;
  url?: string;
}

export interface States {
  [stateName: string]: State;
}

export interface CurrentState {
  name: string;
  params: object;
}

export interface WriteFn {
  (currentState: CurrentState, states: States);
}

interface ListenFnParam {}

export interface ListenFn {
  (myArgument: ListenFnParam): CurrentState;
}

export interface Persistence {
  currentState: CurrentState;
  write: WriteFn;
  listen?: ListenFn;
}
