import 'isomorphic-fetch';
import { requestJSON } from '../../../../main/client/javascript/services/api/http';

describe('Service: http', () => {
  let request;

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
  });

  describe('requestJSON', () => {
    test('will prepend /api/v1 to url', () => {
      requestJSON('/something/123', 'GET', { id: 'abc' }, {});

      expect(request.url).toBe('/api/v1/something/123');
    });
  });
});
