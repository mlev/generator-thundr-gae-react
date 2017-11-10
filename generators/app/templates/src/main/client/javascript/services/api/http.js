import HttpCore from './http-core';

const http = new HttpCore('/api/v1');
export const request = http.request.bind(http);
export const requestJSON = http.requestJSON.bind(http);
