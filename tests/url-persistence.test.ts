import { observe } from 'mobx';
import { createHashHistory, Location } from 'history';
import URLPersistence from '../src/url.persistence';

describe('URL Persistence', () => {
  let persistence;

  beforeAll(() => {
    persistence = new URLPersistence();
  });

  afterEach(() => {
    window.location.hash = '';
    jest.clearAllMocks();
  });

  it('should parse URL correctly', () => {
    persistence._updateLocation({
      pathname: '/hello',
      search: '?what=world&where=bla'
    });
    expect(persistence.currentState).toEqual({
      name: '/hello',
      params: {
        what: 'world',
        where: 'bla'
      }
    });
  });

  it('should write to URL correctly', () => {
    persistence.write(
      {
        name: 'new',
        params: {
          hola: 'amigos',
          this: 'is'
        }
      },
      {
        new: {
          url: '/new'
        }
      }
    );
    expect(persistence._testURL).toEqual('#/new?hola=amigos&this=is');
  });

  it('should allow to observe for currentState changes', () => {
    const spy = jest.fn();
    persistence.listen(spy);
    persistence._updateLocation({
      pathname: '/hello',
      search: '?what=world&where=bla'
    });
    expect(persistence.currentState.name).toBe('/hello');
    expect(spy).toHaveBeenCalled();
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
    activity: null
  });
});

it('should allow resetting query params', () => {
  const persistence = new URLPersistence(createHashHistory());
  persistence._updateLocation(<Location>{
    pathname: '/invalid',
    search: '?what=world&where=bla'
  });
  const stateMachineRouter = new MobxStateMachineRouter({
    states,
    startState: 'HOME',
    query: {
      activity: 'initial'
    },
    persistence
  });
  stateMachineRouter.emit('goToWork');
  expect(stateMachineRouter.currentState.params.activity).toBe('initial');
  stateMachineRouter.emit('slack', { activity: 'daydreaming' });
  expect(stateMachineRouter.currentState.params.activity).toBe('daydreaming');
  expect(persistence._testURL).toBe('#/work?activity=daydreaming');
  stateMachineRouter.emit('slack', { activity: null });
  expect(persistence._testURL).toBe('#/work');
  expect(stateMachineRouter.currentState.params.activity).toBe('initial');
});

it("shouldn't initialize with bad state", () => {
  const persistence = new URLPersistence(createHashHistory());
  persistence._updateLocation(<Location>{
    pathname: '/',
    search: ''
  });
  const stateMachineRouter = new MobxStateMachineRouter({
    states,
    startState: 'HOME',
    query: {
      activity: ''
    },
    persistence
  });
  expect(stateMachineRouter.currentState.params).toEqual({
    activity: ''
  });
});
