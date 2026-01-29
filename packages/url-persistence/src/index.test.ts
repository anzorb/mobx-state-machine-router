import { observe, intercept } from 'mobx';
import URLPersistence from '.';
import MobxStateMachineRouter, {
  IMobxStateMachineRouter,
  TStates,
} from '@mobx-state-machine-router/core';

const ms = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Using string literal types instead of enums
type State = 'HOME' | 'WORK' | 'WORK/LUNCHROOM';
type Action =
  | 'goToWork'
  | 'clean'
  | 'slack'
  | 'goHome'
  | 'getFood'
  | 'eat'
  | 'backToWork'
  | 'tiredAfterLunchGoHome';

type Params = {
  activity?: string | null;
};

const states: TStates<State, Action> = {
  HOME: {
    actions: {
      goToWork: 'WORK',
      clean: 'HOME',
    },
    url: '/',
  },
  WORK: {
    actions: {
      goHome: 'HOME',
      slack: 'WORK',
      getFood: 'WORK/LUNCHROOM',
    },
    url: '/work',
  },
  'WORK/LUNCHROOM': {
    actions: {
      eat: 'WORK/LUNCHROOM',
      backToWork: 'WORK',
      tiredAfterLunchGoHome: 'HOME',
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
      },
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
    stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
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
        name: 'HOME',
        params: {
          activity: null,
        },
      },
      persistence,
    });
    stateMachineRouter.emit('goToWork');
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
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: 'daydreaming' });
    expect(window.location.hash).toBe('#/work?activity=daydreaming');
  });

  it('should update query params with special chars', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: '%+-/!@#$^&*() text' });
    expect(window.location.hash).toBe(
      '#/work?activity=%25%2B-%2F!%40%23%24%5E%26*()%20text',
    );
  });

  it('should read state from query params with special chars', async () => {
    window.location.hash =
      '/work?activity=%25%2B-%2F!%40%23%24%5E%26*()%20text';
    await ms(10);
    expect(stateMachineRouter.currentState.params.activity).toBe(
      '%+-/!@#$^&*() text',
    );
  });

  it('should nullify query params', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: null });
    expect(window.location.hash).toBe('#/work');
  });

  it('should support child states', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('getFood', { coffee: true });
    expect(window.location.hash).toBe('#/work/lunchroom?coffee=true');
  });

  it('should invalid starting urls', () => {
    const persistence = URLPersistence<State, Params, Action>();
    window.location.hash = '#/invalid?what=world&where=bla';
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: null,
        },
      },
      persistence,
    });

    expect(stateMachineRouter.currentState.name).toBe('HOME');
    expect(stateMachineRouter.currentState.params).toEqual({});
  });

  it('should allow resetting query params', () => {
    const persistence = URLPersistence<State, Params, Action>();
    window.location.hash = '#/invalid?what=world&where=bla';
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: 'initial',
        },
      },
      persistence,
    });
    stateMachineRouter.emit('goToWork', { activity: 'initial' });
    expect(stateMachineRouter.currentState.params.activity).toBe('initial');
    stateMachineRouter.emit('slack', { activity: 'daydreaming' });
    expect(stateMachineRouter.currentState.params.activity).toBe('daydreaming');
    expect(window.location.hash).toBe('#/work?activity=daydreaming');
    stateMachineRouter.emit('slack', {});
    expect(window.location.hash).toBe('#/work');
    expect(stateMachineRouter.currentState.params.activity).toBe(undefined);
  });

  it('should allow intecepting of state, which in turn doesn not set the URL', () => {
    const persistence = URLPersistence<State, Params, Action>();
    window.location.hash = '#/';
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: null,
        },
      },
      persistence,
    });

    stateMachineRouter.emit('goToWork', { activity: 'kayaking' });
    expect(window.location.hash).toBe('#/work?activity=kayaking');
    expect(stateMachineRouter.currentState.params.activity).toEqual('kayaking');
    expect(stateMachineRouter.currentState.name).toEqual('WORK');
    intercept(stateMachineRouter, 'currentState', ({ newValue }) => {
      return null;
    });

    stateMachineRouter.emit('goHome', { activity: 'walking' });
    expect(stateMachineRouter.currentState.params.activity).toEqual('kayaking');
    expect(stateMachineRouter.currentState.name).toEqual('WORK');
    expect(window.location.hash).toEqual('#/work?activity=kayaking');
  });
});

type Params2 = Params & {
  bored?: string | null;
};

describe('custom getters/setters - boolean', () => {
  let persistence, stateMachineRouter;
  beforeEach(() => {
    persistence = URLPersistence<State, Params2, Action>({
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
    stateMachineRouter = MobxStateMachineRouter<State, Params2, Action>({
      states,
      currentState: {
        name: 'HOME',
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
    stateMachineRouter.emit('goToWork', { bored: true });
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
    stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
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
    stateMachineRouter.emit('goToWork', { activity: ['bus', 'walking'] });
    expect(window.location.hash).toBe(
      '#/work?activity=%5B%22bus%22,%22walking%22%5D',
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

describe('serializer error handling', () => {
  afterEach(() => {
    window.location.hash = '#/';
    jest.clearAllMocks();
  });

  it('should throw error when custom getter throws', () => {
    let listener: ((update: { location: any }) => void) | null = null;

    const mockHistory = {
      push: jest.fn(),
      listen: (fn: (update: { location: any }) => void) => {
        listener = fn;
      },
      location: { pathname: '/', search: '' },
    };

    URLPersistence({
      history: mockHistory,
      serializers: {
        activity: {
          getter() {
            throw new Error('getter error');
          },
        },
      },
    });

    // Trigger the listener with a URL that has the param with broken getter
    expect(() => {
      listener!({ location: { pathname: '/work', search: '?activity=test' } });
    }).toThrow('getter error');
  });

  it('should throw error when custom setter throws', () => {
    const persistence = URLPersistence({
      serializers: {
        activity: {
          setter() {
            throw new Error('setter error');
          },
        },
      },
    });

    expect(() => {
      persistence.write(
        {
          name: 'WORK',
          params: { activity: 'test' },
        },
        { WORK: { url: '/work' } },
      );
    }).toThrow('setter error');
  });
});
