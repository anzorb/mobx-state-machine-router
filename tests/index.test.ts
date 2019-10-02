import { createHashHistory, Location } from 'history';
import { observe, intercept } from 'mobx';
import interceptAsync from 'mobx-async-intercept';
import MobxStateMachineRouter from '../src';
import URLPersistence from '../src/url.persistence';

const ms = ms => new Promise(resolve => setTimeout(resolve, ms));

const states = {
  HOME: {
    actions: {
      goToWork: 'WORK',
      clean: 'HOME'
    },
    url: '/'
  },
  WORK: {
    actions: {
      goHome: 'HOME',
      slack: 'WORK',
      getFood: 'WORK/LUNCHROOM'
    },
    url: '/work'
  },
  'WORK/LUNCHROOM': {
    actions: {
      eat: 'WORK/LUNCHROOM',
      backToWork: 'WORK',
      tiredAfterLunchGoHome: 'HOME'
    },
    url: '/work/lunchroom'
  }
};

describe('init', () => {
  afterEach(() => {
    window.location.hash = '';
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
    expect(stateMachineRouter.currentState.params.activity).toBe(undefined);
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
      expect(stateMachineRouter.currentState.params.activity).toEqual(
        undefined
      );
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

describe('with URL persistence', () => {
  let stateMachineRouter;

  let persistence;
  beforeEach(() => {
    persistence = new URLPersistence(createHashHistory());
    stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: null
      },
      persistence
    });
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
    stateMachineRouter = null;
    persistence = null;
  });

  it('should do basic routing', () => {
    stateMachineRouter.emit('goToWork');
    expect(persistence._testURL).toBe('#/work');
  });

  it('should ignore unknown routes and ignore state change', () => {
    const spy = jest.fn();
    const spy2 = jest.fn();
    observe(persistence, 'currentState', spy);
    observe(stateMachineRouter, 'currentState', spy2);
    persistence._updateLocation(<Location>{
      pathname: '/somewhere',
      search: '?what=world&where=bla'
    });
    expect(spy).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(stateMachineRouter.currentState.name).toBe('HOME');
  });

  it('should allow resetting query params', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: 'daydreaming' });
    expect(stateMachineRouter.currentState.params.activity).toBe('daydreaming');
    expect(persistence._testURL).toBe('#/work?activity=daydreaming');
    stateMachineRouter.emit('slack', { activity: null });
    expect(persistence._testURL).toBe('#/work');
    expect(stateMachineRouter.currentState.params.activity).toBe(undefined);
  });

  it('should update query params', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: 'daydreaming' });
    expect(persistence._testURL).toBe('#/work?activity=daydreaming');
  });

  it('should nullify query params', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('slack', { activity: null });
    expect(persistence._testURL).toBe('#/work');
  });

  it('should support child states', () => {
    stateMachineRouter.emit('goToWork');
    stateMachineRouter.emit('getFood', { coffee: true });
    expect(persistence._testURL).toBe('#/work/lunchroom?coffee=true');
  });

  it('should listen to persistence layer for changes', () => {
    const spy = jest.fn();
    observe(persistence, 'currentState', spy);
    persistence._updateLocation(<Location>{
      pathname: '/work',
      search: '?what=world&where=bla'
    });
    expect(spy).toHaveBeenCalled();
    expect(stateMachineRouter.currentState.name).toBe('WORK');
  });
});

it('should invalid starting urls', () => {
  const persistence = new URLPersistence(createHashHistory());
  persistence._updateLocation(<Location>{
    pathname: '/invalid',
    search: '?what=world&where=bla'
  });
  const stateMachineRouter = new MobxStateMachineRouter({
    states,
    startState: 'HOME',
    query: {
      activity: null
    },
    persistence
  });
  expect(stateMachineRouter.currentState.name).toBe('HOME');
  expect(stateMachineRouter.currentState.params).toEqual({
    activity: undefined
  });
});

describe('intercepting state changes', () => {
  let stateMachineRouter;
  let persistence;
  beforeEach(() => {
    persistence = new URLPersistence(createHashHistory());
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
    persistence = null;
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
    }, 2);
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
        }, 3);
      });
    });
    stateMachineRouter.emit('goToWork', { activity: 'slack' });
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('HOME');
    }, 2);
    setTimeout(() => {
      expect(stateMachineRouter.currentState.name).toBe('WORK');
      expect(stateMachineRouter.currentState.params.activity).toBe(
        'working-hard'
      );
      done();
    }, 3);
  });
});
