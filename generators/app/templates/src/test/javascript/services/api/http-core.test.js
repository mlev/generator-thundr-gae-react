import 'isomorphic-fetch';
import HttpCore from '../../../../main/client/javascript/services/api/http-core';

describe('Class: HttpCore', () => {
  let request;
  let http;

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((req) => {
      request = req;
      return new Promise((resolve) => {
        resolve({
          ok: true,
          id: '123',
          json: () => ({ id: '123' }),
        });
      });
    });

    http = new HttpCore('/api/v123');
  });

  describe('requestJSON', () => {
    test('will prepend baseUrl to url', () => {
      http.requestJSON('/something/123', 'GET', { id: 'abc' }, {});

      expect(request.url).toBe('/api/v123/something/123');
    });

    test('will default to json if no Content-Type specified', () => {
      http.requestJSON('/something/123', 'GET', { id: 'abc' }, {});

      expect(request.headers.get('Content-Type')).toBe('application/json');
      expect(request.body).toBe('{"id":"abc"}');
    });

    test('will not modify content-type if header already exists', () => {
      const data = { id: 'abc' };
      http.requestJSON('/something/123', 'GET', data, { 'content-type': 'text/plain' });

      expect(request.body).toBe(data);
      expect(request.headers.get('Content-Type')).toBe('text/plain');
    });

    test('will not modify content-type if data is FormData', () => {
      const data = new FormData();
      http.requestJSON('/something/123', 'GET', data, {});

      expect(request.body).toBe(data);
      expect(request.headers.get('Content-Type')).toBe(null);
    });

    test('will return json', () => {
      const promise = http.requestJSON('/something/123', 'GET', null, {});

      return expect(promise).resolves.toEqual({ id: '123' });
    });
  });
});
