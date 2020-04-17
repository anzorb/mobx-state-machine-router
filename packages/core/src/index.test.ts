import { observe, intercept } from 'mobx';
import interceptAsync from 'mobx-async-intercept';
import MobxStateMachineRouter, { IMobxStateMachineRouter } from '../src';

const ms = ms => new Promise(resolve => setTimeout(resolve, ms));

const states = {
  HOME: {
    actions: {
      goToWork: 'WORK',
      clean: 'HOME'
    }
  },
  WORK: {
    actions: {
      goHome: 'HOME',
      slack: 'WORK',
      getFood: 'WORK/LUNCHROOM'
    }
  },
  'WORK/LUNCHROOM': {
    actions: {
      eat: 'WORK/LUNCHROOM',
      backToWork: 'WORK',
      tiredAfterLunchGoHome: 'HOME'
    }
  }
};

describe('init', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow to create instance with null startState or query', () => {
    const stateMachineRouter = new MobxStateMachineRouter({
      states
    });
    expect(stateMachineRouter.currentState.name).toBe('HOME');
    expect(stateMachineRouter.currentState.params).toEqual({});
  });

  it('should allow to create instance with different startStates + validation', () => {
    const stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'AAAH',
      query: {
        activity: null
      }
    });
    expect(stateMachineRouter.currentState.name).not.toBe('AAAH');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow to create instance with empty query', () => {
    const stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {}
    });
    expect(Object.keys(stateMachineRouter.currentState.params).length).toBe(0);
  });

  it('should allow to create instance with queries and setup observables for them', () => {
    const stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: 'biking'
      }
    });
    const spy = jest.fn();
    observe(stateMachineRouter.currentState.params, 'activity', spy);
    expect(stateMachineRouter.currentState.params.activity).toBe('biking');
    stateMachineRouter.emit('goToWork', { activity: 'walking' });
    expect(spy).toHaveBeenCalled();
  });
});

describe('MobX state machine router', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: ''
      }
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter = null;
  });

  describe('basics', () => {
    it('should init', () => {
      expect(stateMachineRouter.state).toBe('HOME');
    });

    it('should do basic routing', () => {
      stateMachineRouter.emit('goToWork');
      expect(stateMachineRouter.state).toBe('WORK');
    });

    it('should update query params', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: 'daydreaming' });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(
        'daydreaming'
      );
    });

    it('should nullify query params', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: null });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toEqual(null);
    });

    it('should support child states', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('getFood', { coffee: true });
      expect(stateMachineRouter.state).toBe('WORK/LUNCHROOM');
      expect(stateMachineRouter.currentState.params.coffee).toEqual(true);
    });
  });

  describe('reactivity', () => {
    it('should allow us to listen to specific query changes', () => {
      stateMachineRouter.emit('goToWork');
      const listener = jest.fn();
      observe(stateMachineRouter.currentState.params, 'activity', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(listener).toHaveBeenCalled();
    });

    it('should not change state if resulting state does not exist', () => {
      const listener = jest.fn();
      observe(stateMachineRouter.currentState.params, 'activity', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(stateMachineRouter.currentState.params.activity).toBe('');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow adding dynamic query params at runtime', () => {
      const listener = jest.fn();
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { mood: 'need-coffee' });
      observe(stateMachineRouter.currentState.params, 'mood', listener);
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
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      // subscribe to the whole object
      observe(stateMachineRouter, 'currentState', listener);
      observe(stateMachineRouter.currentState.params, 'activity', listener2);
      observe(stateMachineRouter.currentState.params, 'activity', listener3);
      stateMachineRouter.emit('slack', { activity: 'sleeping' });
      expect(listener).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });
  });
});

describe.skip('history', () => {
  it('should allow to go back', () => {
    const stateMachineRouter: IMobxStateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: null
      }
    });
    stateMachineRouter.emit('goToWork', { method: 'car' });
    stateMachineRouter.emit('getFood', {
      ...stateMachineRouter.currentState.params,
      method: null
    });
    stateMachineRouter.emit('tiredAfterLunchGoHome', {
      ...stateMachineRouter.currentState.params
    });
    // expect(stateMachineRouter.currentState.params).toEqual({
    //   activity: null,
    //   method: undefined
    // });
    expect(stateMachineRouter.currentState.name).toBe('HOME');
    stateMachineRouter.emit('goBack');
    expect(stateMachineRouter.currentState.name).toBe('WORK/LUNCHROOM');
    // expect(stateMachineRouter.currentState.params).toEqual({
    //   activity: null,
    //   method: undefined
    // });
    stateMachineRouter.emit('goBack');
    expect(stateMachineRouter.currentState.name).toBe('WORK');
    stateMachineRouter.emit('goBack');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
    // expect(stateMachineRouter.currentState.params).toEqual({
    //   activity: null,
    //   method: 'car'
    // });
  });
});

describe('intercepting state changes', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: null
      }
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter = null;
  });

  it('should allow to intercept state change and override result state', () => {
    intercept(stateMachineRouter, 'currentState', object => {
      return { ...object, newValue: { ...object.newValue, name: 'HOME' } };
    });
    stateMachineRouter.emit('goToWork');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow to intercept state change and stop state change', () => {
    intercept(stateMachineRouter, 'currentState', object => {
      return null;
    });
    stateMachineRouter.emit('goToWork');
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow to async intercept', done => {
    interceptAsync(stateMachineRouter, 'currentState', object => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ...object,
            newValue: { ...object.newValue, name: 'ERROR' }
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

  it('should allow to async intercept to update param', done => {
    interceptAsync(stateMachineRouter, 'currentState', object => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ...object,
            newValue: {
              ...object.newValue,
              params: { ...object.newValue.params, activity: 'working-hard' }
            }
          });
        }, 10);
      });
    });
    stateMachineRouter.emit('goToWork', { activity: 'slack' });
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('HOME');
    }, 0);
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toBe(
        'working-hard'
      );
      done();
    }, 30);
  });
});
