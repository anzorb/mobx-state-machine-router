import { observe, intercept, observable } from 'mobx';
import interceptAsync from 'mobx-async-intercept';
import MobxStateMachineRouter, { TStates } from '../src';
import { observeParam } from './index';

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

describe('init', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow to create instance with null startState or query', () => {
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
    });
    expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
    expect(stateMachineRouter.currentState.params).toEqual({});
  });

  it('should allow to create instance with different startStates + validation', () => {
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: 'AAAH' as STATE,
        params: {
          activity: null,
        },
      },
    });
    expect(stateMachineRouter.currentState.name).not.toBe('AAAH');
    expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
  });

  it('should allow to create instance with empty query', () => {
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {},
      },
    });
    expect(Object.keys(stateMachineRouter.currentState.params).length).toBe(0);
  });

  it('should allow to create instance with queries and setup observables for them', () => {
    const stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
        params: {
          activity: 'biking',
        },
      },
    });
    const spy = jest.fn();
    observe(stateMachineRouter, 'currentState', spy);
    expect(stateMachineRouter.currentState.params.activity).toBe('biking');
    stateMachineRouter.emit(ACTION.goToWork, { activity: 'walking' });
    expect(spy).toHaveBeenCalled();
  });
});

describe('MobX state machine router', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
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
      expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
    });

    it('should do basic routing', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      expect(stateMachineRouter.currentState.name).toBe('WORK');
    });

    it('should update query params', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      stateMachineRouter.emit(ACTION.slack, { activity: 'daydreaming' });
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(
        'daydreaming',
      );
      stateMachineRouter.emit(ACTION.goHome, {
        ...stateMachineRouter.currentState.params,
        method: 'car',
      });
      expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
      expect(stateMachineRouter.currentState.params).toEqual({
        activity: 'daydreaming',
        method: 'car',
      });
    });

    it('should nullify query params', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      stateMachineRouter.emit(ACTION.slack, { activity: null });
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(null);
    });

    it('should support child states', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      stateMachineRouter.emit(ACTION.getFood, { coffee: true });
      expect(stateMachineRouter.currentState.name).toBe('WORK/LUNCHROOM');
      expect(stateMachineRouter.currentState.params.coffee).toEqual(true);
    });
  });

  describe('reactivity', () => {
    it('should allow us to listen to specific query changes', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit(ACTION.slack, { activity: 'ping-pong' });
      expect(listener).toHaveBeenCalled();
    });

    it('should not change state if resulting state does not exist', () => {
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit(ACTION.slack, { activity: 'ping-pong' });
      expect(stateMachineRouter.currentState.params.activity).toBe('');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow adding dynamic query params at runtime', () => {
      const listener = jest.fn();
      stateMachineRouter.emit(ACTION.goToWork);
      stateMachineRouter.emit(ACTION.slack, { mood: 'need-coffee' });
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit(ACTION.slack, { mood: 'so-many-jitters' });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow listening to the whole query for changes', () => {
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit(ACTION.goToWork);
      expect(listener).toHaveBeenCalled();
    });

    it('should emit correct updates', () => {
      stateMachineRouter.emit(ACTION.goToWork);
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit(ACTION.slack, { activity: 'sleeping' });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow observing individual params', () => {
      const spy = jest.fn();
      observeParam(stateMachineRouter, 'currentState', 'activity', spy);
      stateMachineRouter.emit(ACTION.goToWork, { activity: 'crawling' });
      expect(spy).toHaveBeenCalled();
    });
  });
});

describe('intercepting state changes', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = MobxStateMachineRouter<STATE, TParams, ACTION>({
      states,
      currentState: {
        name: STATE.HOME,
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
      return { ...object, newValue: { ...object.newValue, name: STATE.HOME } };
    });
    stateMachineRouter.emit(ACTION.goToWork);
    expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
  });

  it('should allow to intercept state change and stop state change', () => {
    intercept(stateMachineRouter, 'currentState', (object) => {
      return null;
    });
    stateMachineRouter.emit(ACTION.goToWork);
    expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
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
    stateMachineRouter.emit(ACTION.goToWork, { activity: 'slack' });
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);
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

    stateMachineRouter.emit(ACTION.goToWork, { activity: 'slack' });
    await ms(1);

    expect(stateMachineRouter.currentState.name).toBe(STATE.HOME);

    await ms(30);
    expect(stateMachineRouter.currentState.name).toBe('WORK');
    expect(stateMachineRouter.currentState.params.activity).toBe(
      'working-hard',
    );
  });
});
