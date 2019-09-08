import MobxStateMachineRouter from '../src';
import { createHashHistory } from 'history';
import { observe } from 'mobx';

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
      getFood: 'WORK.LUNCHROOM'
    },
    url: '/work'
  },
  'WORK.LUNCHROOM': {
    actions: {
      eat: 'WORK.LUNCHROOM',
      backToWork: 'WORK',
      tiredAfterLunchGoHome: 'HOME'
    },
    url: '/work/lunchroom'
  }
};

describe('init', () => {
  let stateMachineRouter;
  beforeEach(() => {
    stateMachineRouter = new MobxStateMachineRouter({
      states,
      startState: 'HOME',
      query: {
        activity: null
      },
      history: createHashHistory()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basics', () => {
    it('should init', () => {
      expect(stateMachineRouter.state).toBe('HOME');
    });

    it('should do basic routing', () => {
      stateMachineRouter.emit('goToWork');
      expect(stateMachineRouter.state).toBe('WORK');
      expect(window.location.hash).toBe('#/work');
    });

    it('should update query params', () => {
      stateMachineRouter.emit('slack', { activity: 'daydreaming' });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(window.location.hash).toBe('#/work?activity=daydreaming');
    });

    it('should nullify query params', () => {
      stateMachineRouter.emit('slack', { activity: null });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(window.location.hash).toBe('#/work');
    });
  });

  it('should support child states', () => {
    stateMachineRouter.emit('getFood');
    expect(stateMachineRouter.state).toBe('WORK.LUNCHROOM');
    expect(window.location.hash).toBe('#/work/lunchroom');
  });

  describe('reactivity', () => {
    it('should allow us to listen to specific query changes', () => {
      const listener = jest.fn();
      observe(stateMachineRouter.query, 'activity', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow adding dynamic query params at runtime', () => {
      const listener = jest.fn();
      stateMachineRouter.emit('slack', { mood: 'need-coffee' });
      observe(stateMachineRouter.query, 'mood', listener);
      stateMachineRouter.emit('slack', { mood: 'so-many-jitters' });
      expect(listener).toHaveBeenCalled();
    });
  });
});
