import { observe, intercept } from 'mobx';
import URLPersistence from '.';
import { IMobxStateMachineRouter, TStates } from '../../core/src';
import MobxStateMachineRouter from '../../core/src';

const ms = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

enum STATE {
  HOME = 'HOME',
  WORK = 'WORK',
  'WORK/LUNCHROOM' = 'WORK/LUNCHROOM',
}

enum ACTION {
  goToWork = 'goToWork',
  clean = 'clean',
  slack = 'slack',
  goHome = 'goHome',
  getFood = 'getFood',
  eat = 'eat',
  backToWork = 'backToWork',
  tiredAfterLunchGoHome = 'tiredAfterLunchGoHome',
}

type TParams = {
  activity?: string | null;
};

const states: TStates<STATE, ACTION> = {
  [STATE.HOME]: {
    actions: {
      [ACTION.goToWork]: STATE.WORK,
      [ACTION.clean]: STATE.HOME,
    },
    url: '/',
  },
  [STATE.WORK]: {
    actions: {
      [ACTION.goHome]: STATE.HOME,
      [ACTION.slack]: STATE.WORK,
      [ACTION.getFood]: STATE['WORK/LUNCHROOM'],
    },
    url: '/work',
  },
  [STATE['WORK/LUNCHROOM']]: {
    actions: {
      [ACTION.eat]: STATE['WORK/LUNCHROOM'],
      [ACTION.backToWork]: STATE.WORK,
      [ACTION.tiredAfterLunchGoHome]: STATE.HOME,
    },
    url: '/work/lunchroom',
  },
};

describe('URL Persistence', () => {
  let persistence;

  beforeEach(() => {
    persistence = URLPersistence();
  });

  afterEach(() => {
    window.location.hash = '#/';
    jest.clearAllMocks();
  });

  it('should parse URL correctly', async () => {
    window.location.hash = '#/hello?what=world&where=bla';
    await ms(10);
    expect(persistence.currentState).toEqual({
      name: '/hello',
      params: {
        what: 'world',
        where: 'bla',
      },
    });
  });

  it('should write to URL correctly', () => {
    persistence.write(
      {
        name: 'new',
        params: {
          hola: 'amigos',
          this: 'is',
        },
      },
      {
        new: {
          url: '/new',
        },
      }
    );
    expect(window.location.hash).toEqual('#/new?hola=amigos&this=is');
  });

  it('should allow to observe for currentState changes', async () => {
    window.location.hash = '#/hello?what=world&where=bla';
    await ms(10);
    expect(persistence.currentState.name).toBe('/hello');
  });
});

describe('with URL persistence', () => {
  let stateMachineRouter;

  let persistence;
  beforeEach(() => {
    persistence = URLPersistence();
    stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
        },
      },
      persistence,
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter = null;
    persistence = null;
  });

  it('should do basic routing', () => {
    persistence = URLPersistence();
    stateMachineRouter = MobxStateMachineRouter({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
        },
      },
      persistence,
    });
    stateMachineRouter.emit(ACTION.goToWork);
    expect(window.location.hash).toBe('#/work');
  });

  it('should ignore unknown routes and ignore state change', () => {
    const spy2 = jest.fn();
    observe(stateMachineRouter, 'currentState', spy2);
    window.location.hash = '/somewhere?what=world&where=bla';
    expect(spy2).not.toHaveBeenCalled();
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should update query params', () => {
    stateMachineRouter.emit(ACTION.goToWork);
    stateMachineRouter.emit(ACTION.slack, { activity: 'daydreaming' });
    expect(window.location.hash).toBe('#/work?activity=daydreaming');
  });

  it('should update query params with special chars', () => {
    stateMachineRouter.emit(ACTION.goToWork);
    stateMachineRouter.emit(ACTION.slack, { activity: '%+-/!@#$^&*() text' });
    expect(window.location.hash).toBe(
      '#/work?activity=%25%2B-%2F!%40%23%24%5E%26*()%20text'
    );
  });

  it('should read state from query params with special chars', async () => {
    window.location.hash =
      '/work?activity=%25%2B-%2F!%40%23%24%5E%26*()%20text';
    await ms(10);
    expect(stateMachineRouter.currentState.params.activity).toBe(
      '%+-/!@#$^&*() text'
    );
  });

  it('should nullify query params', () => {
    stateMachineRouter.emit(ACTION.goToWork);
    stateMachineRouter.emit(ACTION.slack, { activity: null });
    expect(window.location.hash).toBe('#/work');
  });

  it('should support child states', () => {
    stateMachineRouter.emit(ACTION.goToWork);
    stateMachineRouter.emit(ACTION.getFood, { coffee: true });
    expect(window.location.hash).toBe('#/work/lunchroom?coffee=true');
  });

  it('should invalid starting urls', () => {
    const persistence = URLPersistence<STATE, TParams, ACTION>();
    window.location.hash = '#/invalid?what=world&where=bla';
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
        },
      },
      persistence,
    });

    expect(stateMachineRouter.currentState.name).toBe('HOME');
    expect(stateMachineRouter.currentState.params).toEqual({});
  });

  // after updating to history@5, the URL is not being correctly written to when running in JSDOM
  it('should allow resetting query params', () => {
    const persistence = URLPersistence<STATE, TParams, ACTION>();
    window.location.hash = '#/invalid?what=world&where=bla';
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: 'initial',
        },
      },
      persistence,
    });
    stateMachineRouter.emit(ACTION.goToWork, { activity: 'initial' });
    expect(stateMachineRouter.currentState.params.activity).toBe('initial');
    stateMachineRouter.emit(ACTION.slack, { activity: 'daydreaming' });
    expect(stateMachineRouter.currentState.params.activity).toBe('daydreaming');
    expect(window.location.hash).toBe('#/work?activity=daydreaming');
    stateMachineRouter.emit(ACTION.slack, {});
    expect(window.location.hash).toBe('#/work');
    expect(stateMachineRouter.currentState.params.activity).toBe(undefined);
  });

  it('should allow intecepting of state, which in turn doesn not set the URL', () => {
    const persistence = URLPersistence<STATE, TParams, ACTION>();
    window.location.hash = '#/';
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
        },
      },
      persistence,
    });

    stateMachineRouter.emit(ACTION.goToWork, { activity: 'kayaking' });
    expect(window.location.hash).toBe('#/work?activity=kayaking');
    expect(stateMachineRouter.currentState.params.activity).toEqual('kayaking');
    expect(stateMachineRouter.currentState.name).toEqual('WORK');
    intercept(stateMachineRouter, 'currentState', ({ newValue }) => {
      return null;
    });

    stateMachineRouter.emit(ACTION.goHome, { activity: 'walking' });
    expect(stateMachineRouter.currentState.params.activity).toEqual('kayaking');
    expect(stateMachineRouter.currentState.name).toEqual('WORK');
    expect(window.location.hash).toEqual('#/work?activity=kayaking');
  });
});

type TParams2 = TParams & {
  bored?: string | null;
};

describe('custom getters/setters - boolean', () => {
  let persistence, stateMachineRouter;
  beforeEach(() => {
    persistence = URLPersistence<STATE, TParams2, ACTION>({
      serializers: {
        bored: {
          getter(value) {
            return value === 'true';
          },
          setter(value) {
            return value.toString();
          },
        },
      },
    });
    stateMachineRouter = MobxStateMachineRouter<STATE, TParams2, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
          bored: null,
        },
      },
      persistence,
    });
  });

  afterEach(() => {
    stateMachineRouter.destroy();
    window.location.hash = '#/';
    jest.clearAllMocks();
  });

  it('should allow users to specify custom serializer', () => {
    stateMachineRouter.emit(ACTION.goToWork, { bored: true });
    expect(window.location.hash).toBe('#/work?bored=true');
  });

  it('should allow users to specify custom serializer getter', async () => {
    window.location.hash = '/work?bored=true';
    await ms(10);
    expect(stateMachineRouter.currentState.params.bored).toEqual(true);
  });
});

describe('custom getters/setters - array', () => {
  let persistence, stateMachineRouter;
  beforeEach(() => {
    persistence = URLPersistence({
      serializers: {
        activity: {
          getter(value: string) {
            return JSON.parse(decodeURI(value));
          },
          setter(value: []) {
            return encodeURI(JSON.stringify(value));
          },
        },
      },
    });
    stateMachineRouter = MobxStateMachineRouter<
      STATE,
      TParams,
      ACTION
    >({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: null,
        },
      },
      persistence,
    });
  });

  afterEach(() => {
    stateMachineRouter.destroy();
    window.location.hash = '#/';
    jest.clearAllMocks();
  });

  it('should allow users to specify custom serializer', () => {
    stateMachineRouter.emit(ACTION.goToWork, { activity: ['bus', 'walking'] });
    expect(window.location.hash).toBe(
      '#/work?activity=%5B%22bus%22,%22walking%22%5D'
    );
  });

  it('should allow users to specify custom serializer getter', async () => {
    window.location.hash = '#/work?activity=%5B%22bus%22,%22walking%22%5D';
    await ms(10);
    expect(stateMachineRouter.currentState.params.activity).toEqual([
      'bus',
      'walking',
    ]);
  });
});
