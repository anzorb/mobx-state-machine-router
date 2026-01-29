import { observe, intercept, observable } from 'mobx';
import interceptAsync from 'mobx-async-intercept';
import MobxStateMachineRouter, { TStates } from '../src';
import { observeParam } from './index';

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

describe('init', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow to create instance with null startState or query', () => {
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
    });
    expect(stateMachineRouter.currentState.name).toBe('HOME');
    expect(stateMachineRouter.currentState.params).toEqual({});
  });

  it('should allow to create instance with different startStates + validation', () => {
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'AAAH' as State,
        params: {
          activity: null,
        },
      },
    });
    expect(stateMachineRouter.currentState.name).not.toBe('AAAH');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should fallback to first state when currentState.name is undefined', () => {
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: undefined as unknown as State,
        params: {},
      },
    });
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should fallback to first state when current state becomes empty via persistence', () => {
    // Create a mock persistence that can trigger state changes
    const mockPersistence = observable({
      currentState: {
        name: '/', // Valid route that maps to HOME
        params: {},
      },
      write: jest.fn(),
    });

    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {},
      },
      persistence: mockPersistence,
    });

    expect(stateMachineRouter.currentState.name).toBe('HOME');

    // Trigger an invalid route from persistence - this tests line 141 (route != null check)
    mockPersistence.currentState = { name: '/invalid', params: {} };
    // State should remain HOME since /invalid doesn't map to any state
    expect(stateMachineRouter.currentState.name).toBe('HOME');

    stateMachineRouter.destroy();
  });

  it('should allow to create instance with empty query', () => {
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {},
      },
    });
    expect(Object.keys(stateMachineRouter.currentState.params).length).toBe(0);
  });

  it('should allow to create instance with queries and setup observables for them', () => {
    const stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: 'biking',
        },
      },
    });
    const spy = jest.fn();
    observe(stateMachineRouter, 'currentState', spy);
    expect(stateMachineRouter.currentState.params.activity).toBe('biking');
    stateMachineRouter.emit('goToWork', { activity: 'walking' });
    expect(spy).toHaveBeenCalled();
  });
});

describe('MobX state machine router', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: '',
        },
      },
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter.destroy();
    stateMachineRouter = null;
  });

  describe('basics', () => {
    it('should init', () => {
      expect(stateMachineRouter.currentState.name).toBe('HOME');
    });

    it('should do basic routing', () => {
      stateMachineRouter.emit('goToWork');
      expect(stateMachineRouter.currentState.name).toBe('WORK');
    });

    it('should update query params', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: 'daydreaming' });
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(
        'daydreaming',
      );
      stateMachineRouter.emit('goHome', {
        ...stateMachineRouter.currentState.params,
        method: 'car',
      });
      expect(stateMachineRouter.currentState.name).toBe('HOME');
      expect(stateMachineRouter.currentState.params).toEqual({
        activity: 'daydreaming',
        method: 'car',
      });
    });

    it('should nullify query params', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: null });
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(null);
    });

    it('should support child states', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('getFood', { coffee: true });
      expect(stateMachineRouter.currentState.name).toBe('WORK/LUNCHROOM');
      expect(stateMachineRouter.currentState.params.coffee).toEqual(true);
    });
  });

  describe('reactivity', () => {
    it('should allow us to listen to specific query changes', () => {
      stateMachineRouter.emit('goToWork');
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(listener).toHaveBeenCalled();
    });

    it('should not change state if resulting state does not exist', () => {
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(stateMachineRouter.currentState.params.activity).toBe('');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow adding dynamic query params at runtime', () => {
      const listener = jest.fn();
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { mood: 'need-coffee' });
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('slack', { mood: 'so-many-jitters' });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow listening to the whole query for changes', () => {
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('goToWork');
      expect(listener).toHaveBeenCalled();
    });

    it('should emit correct updates', () => {
      stateMachineRouter.emit('goToWork');
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('slack', { activity: 'sleeping' });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow observing individual params', () => {
      const spy = jest.fn();
      observeParam(stateMachineRouter, 'currentState', 'activity', spy);
      stateMachineRouter.emit('goToWork', { activity: 'crawling' });
      expect(spy).toHaveBeenCalled();
    });
  });
});

describe('intercepting state changes', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = MobxStateMachineRouter<State, Params, Action>({
      states,
      currentState: {
        name: 'HOME',
        params: {
          activity: null,
        },
      },
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter.destroy();
    stateMachineRouter = null;
  });

  it('should allow to intercept state change and override result state', () => {
    intercept(stateMachineRouter, 'currentState', (object) => {
      return { ...object, newValue: { ...object.newValue, name: 'HOME' } };
    });
    stateMachineRouter.emit('goToWork');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow to intercept state change and stop state change', () => {
    intercept(stateMachineRouter, 'currentState', (object) => {
      return null;
    });
    stateMachineRouter.emit('goToWork');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow to async intercept', (done) => {
    interceptAsync(stateMachineRouter, 'currentState', (object) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ...object,
            newValue: { ...object.newValue, name: 'ERROR' },
          });
        }, 3);
      });
    });
    stateMachineRouter.emit('goToWork', { activity: 'slack' });
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('HOME');
    }, 0);
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('ERROR');
      expect(stateMachineRouter.currentState.params.activity).toBe('slack');
      done();
    }, 3);
  });

  it('should allow to async intercept to update param', async () => {
    interceptAsync(stateMachineRouter, 'currentState', (object) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ...object,
            newValue: {
              ...object.newValue,
              params: { ...object.newValue.params, activity: 'working-hard' },
            },
          });
        }, 10);
      });
    });

    stateMachineRouter.emit('goToWork', { activity: 'slack' });
    await ms(1);

    expect(stateMachineRouter.currentState.name).toBe('HOME');

    await ms(30);
    expect(stateMachineRouter.currentState.name).toBe('WORK');
    expect(stateMachineRouter.currentState.params.activity).toBe(
      'working-hard',
    );
  });
});
