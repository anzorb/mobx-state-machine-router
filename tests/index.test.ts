import { createHashHistory } from 'history';
import { observe } from 'mobx';
import MobxStateMachineRouter from '../src';
import URLPersistence from '../src/url.persistence';

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

describe('MobX state machine router', () => {
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
      expect(stateMachineRouter.currentState.params.activity).toBe(null);
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
      stateMachineRouter.emit('goToWork');
      const listener = jest.fn();
      observe(stateMachineRouter, 'currentState', listener);
      stateMachineRouter.emit('slack', { activity: 'sleeping' });
      expect(listener).toHaveBeenCalled();
    });
  });
});

describe('with URL persistence', () => {
  let stateMachineRouter, persistence;
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
    jest.clearAllMocks();
    stateMachineRouter = null;
  });

  it('should do basic routing', () => {
    stateMachineRouter.emit('goToWork');
    expect(persistence._testURL).toBe('#/work');
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
    expect(persistence._testURL).toBe('#/work%2Flunchroom?coffee=true');
  });
});
