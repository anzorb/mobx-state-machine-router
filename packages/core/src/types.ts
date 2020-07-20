export interface IWriteFn {
    (currentState: ICurrentState, states: IStates);
  }

  export interface IPersistence {
    currentState: ICurrentState;
    write: IWriteFn;
  }

  export interface IActions {
    [actionName: string]: string;
  }

  export interface IState {
    actions: IActions;
    url?: string;
  }

  export interface IStates {
    [stateName: string]: IState;
  }

  export interface IQuery {
    [param: string]: any;
  }

  export interface IMobxStateMachineRouterParams {
    states: IStates;
    currentState?: {
      name?: string;
      params?: IQuery;
    };
    persistence?: IPersistence;
  }

  export interface IReverseRoutes {
    [param: string]: string;
  }

  export interface ICurrentState {
    name: string;
    params: IQuery;
  }

  export interface IMobxStateMachineRouter {
    currentState: ICurrentState;
    emit: (actionName: string, params?: object) => void;
    destroy: () => void;
  }
