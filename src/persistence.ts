interface WriteFn {
  (currentState: CurrentState);
}

interface ListenFnParam {}

interface ListenFn {
  (myArgument: ListenFnParam): CurrentState;
}

export interface Persistence {
  currentState: CurrentState;
  write: WriteFn;
  listen?: ListenFn;
}

export interface CurrentState {
  name: string;
  params: queryString.ParsedQuery;
}
