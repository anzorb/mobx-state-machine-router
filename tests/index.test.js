import MobxStateMachineRouter from '../src';
import { createHashHistory } from 'history';
import { observe } from 'mobx';
import { JSDOM } from 'jsdom';
import { parseURL } from 'whatwg-url';

Object.defineProperty(global, 'window', {
  writable: true,
  value: global.window
});

const makeLocation = url => {
  const tokens = url.split('/');
  const pathname = tokens[1].split('?')[0];
  const query = tokens[1].split('?')[1]; //.split('&');
  const queryObj = {};
  for (let i = 0; i < query.length; i++) {
    const items = query[i].split('=');
    queryObj[items[0]] = items[1];
  }

  return {
    pathname,
    hash: pathname,
    href: url,
    search: '?' + query
  };
  //while (done === false) {}
  //const search = tokens[3].split('?=')[1].split('&=');
  //console.log(queryObj);
};

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

describe('MobX state machine router', () => {
  let stateMachineRouter;
  beforeEach(() => {
    //window = new JSDOM(undefined, { url: 'http://google.com' }).window;
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
    stateMachineRouter = null;
    window.location.href = '/';
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
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: 'daydreaming' });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(window.location.hash).toBe('#/work?activity=daydreaming');
    });

    it('should nullify query params', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { activity: null });
      expect(stateMachineRouter.state).toBe('WORK');
      expect(window.location.hash).toBe('#/work');
    });

    it('should support child states', () => {
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('getFood');
      expect(stateMachineRouter.state).toBe('WORK.LUNCHROOM');
      expect(window.location.hash).toBe('#/work/lunchroom');
    });
  });

  describe('reactivity', () => {
    it('should allow us to listen to specific query changes', () => {
      stateMachineRouter.emit('goToWork');
      const listener = jest.fn();
      observe(stateMachineRouter.query, 'activity', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      console.log(stateMachineRouter.query.activity);
      expect(listener).toHaveBeenCalled();
    });

    it('should not change state if resulting state does not exist', () => {
      const listener = jest.fn();
      observe(stateMachineRouter.query, 'activity', listener);
      stateMachineRouter.emit('slack', { activity: 'ping-pong' });
      expect(stateMachineRouter.query.activity).toBe(null);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow adding dynamic query params at runtime', () => {
      const listener = jest.fn();
      stateMachineRouter.emit('goToWork');
      stateMachineRouter.emit('slack', { mood: 'need-coffee' });
      observe(stateMachineRouter.query, 'mood', listener);
      stateMachineRouter.emit('slack', { mood: 'so-many-jitters' });
      expect(listener).toHaveBeenCalled();
    });

    // it('should allow listening to the whole query for changes', () => {
    //   stateMachineRouter.emit('goToWork');
    //   const listener = jest.fn();
    //   observe(stateMachineRouter, 'query', listener);
    //   stateMachineRouter.emit('slack', { activity: 'sleeping' });
    //   expect(listener).toHaveBeenCalled();
    // });
  });

  // describe.only('react to url changes', () => {
  //   it('should parse URL into query observables', () => {
  //     stateMachineRouter.parseURL(
  //       //console.log(
  //       parseURL(
  //         'http://localhost/work?activity=daydreaming&activity2=daydreaming2'
  //       )
  //     );
  //     //);
  //     // window.history.pushState(
  //     //   {},
  //     //   'Test Title',
  //     //   '/work?activity=daydreaming&activity2=daydreaming2'
  //     // );
  //     //expect(stateMachineRouter.query.activity).toBe('sleeping');
  //     expect(stateMachineRouter.state).toBe('WORK');
  //   });
  // });
});
