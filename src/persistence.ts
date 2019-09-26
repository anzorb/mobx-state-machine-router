export interface CurrentState {
  name: string;
  params: object;
}

export interface WriteFn {
  (currentState: CurrentState);
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
