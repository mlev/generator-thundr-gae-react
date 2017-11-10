/* eslint-disable class-methods-use-this */

// required so IE11 does not automatically cache all GET requests
const noCacheHeaders = {
  pragma: 'no-cache',
  'cache-control': 'no-cache',
};

const hasHeader = (headers = {}, headerName) =>
  Object
    .keys(headers)
    .some(key => key.toLowerCase() === headerName.toLowerCase());

export default class HttpCore {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   Prepares a fetch Request from given parameters
   @param {string} path
   @param {string} method
   @param {object} body
   @param {object} headers
   @return {Request} Request object representing parameters
   */
  prepareRequest(path, method = 'GET', body = null, headers = {}) {
    const url = `${this.baseUrl}${path}`;
    console.log(`${method} ${url}`);

    const config = {
      method,
      headers: { ...noCacheHeaders, ...headers },
      credentials: 'include',
    };

    // Edge browsers will fail silently if you give a body, even a null one, to a GET request
    if (body) {
      config.body = body;
    }

    return new Request(url, config);
  }

  /**
   Performs the fetch for the given request
   @param {Request} request
   @return {Promise} Promise object resolving to fetch response
   */
  fetchRequest(request) {
    return fetch(request).then(response => this.processResponse(response));
  }

  /**
   Process the response from a fetch
   @param {Response} response
   @return {Response|Error} the Response if valid or extracted Error
   */
  processResponse(response) {
    if (response.ok) {
      return response;
    }

    return response.text()
      .then((text) => {
        let error;

        try {
          // Attempt to parse body as JSON, fallback to plain text if parsing fails
          const data = JSON.parse(text);
          error = new Error(data.message);
          error.type = data.type;
        } catch (e) {
          // Fallback to plain text
          error = new Error(response.statusText);
        }

        error.status = response.status;
        error.payload = text;

        throw error;
      });
  }

  /**
   Performs a fetch for given parameters
   @param {string} path
   @param {string} method
   @param {object} body
   @param {object} headers
   @return {Promise} Promise object resolving to fetch response
   */
  request(path, method, body, headers) {
    const request = this.prepareRequest(path, method, body, headers);
    return this.fetchRequest(request);
  }

  /**
   Performs a fetch for given parameters, expecting a JSON response
   @param {string} path
   @param {string} method
   @param {object} data
   @param {object} headers
   @return {Promise} Promise resolving to response json
   */
  requestJSON(path, method, data, headers = {}) {
    return (data
      ? this.requestWithData(path, method, data, headers)
      : this.request(path, method, null, headers))
      .then(response => (response.status !== 204 ? response.json() : null));
  }

  /**
   * @private
   */
  requestWithData(path, method, data, headers = {}) {
    const headerContentType = 'Content-Type';
    // Don't modify for FormData or request with existing content-type header set
    if (data instanceof FormData || hasHeader(headers, headerContentType)) {
      return this.request(path, method, data, headers);
    }
    // Otherwise default to JSON
    return this.request(path, method, JSON.stringify(data), { [headerContentType]: 'application/json', ...headers });
  }
}
