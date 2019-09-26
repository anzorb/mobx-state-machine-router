import { observe } from 'mobx';
import URLPersistence from '../src/url.persistence';

describe('URL Persistence', () => {
  let persistence;

  beforeAll(() => {
    persistence = new URLPersistence();
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
    persistence.write({
      name: 'new',
      params: {
        hola: 'amigos',
        this: 'is'
      }
    });
    expect(persistence._testURL).toEqual('#/new?hola=amigos&this=is');
  });

  it('should allow to observe for currentState changes', () => {
    const spy = jest.fn();
    observe(persistence, '_location', spy);
    persistence._updateLocation({
      pathname: '/hello',
      search: '?what=world&where=bla'
    });
    expect(persistence.currentState.name).toBe('/hello');
    expect(spy).toHaveBeenCalled();
  });
});
