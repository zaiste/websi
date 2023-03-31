import type { PlainObject } from './mod.ts';
import { isPlainObject } from './util.ts';

// 2xx
export const OK = <T = PlainObject>(body: BodyInit | T, headers = {}) => {
  const init = { status: 200, headers };
  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

export const Created = <T = PlainObject>(body: BodyInit | T = '', headers = {}) => {
  const init = { status: 201, headers };
  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

export const Accepted = (headers = {}) => new Response('', { status: 202, headers });

export const NoContent = (headers = {}) => new Response('', { status: 204, headers });

// 3xx
export const Redirect = (url: string, status = 302) => Response.redirect(url, status);

// 4xx
export const BadRequest = <T = PlainObject>(body: BodyInit | T = '') => {
  const init = { status: 400 };

  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

export const Unauthorized = <T = PlainObject>(body: BodyInit | T = '') => {
  const init = { status: 401 };
  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

export const Forbidden = <T = PlainObject>(body: BodyInit | T = '') => {
  const init = { status: 403 };
  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

export const NotFound = (headers = {}) => new Response('Not Found', { status: 404, headers });

export const MethodNotAllowed = () => new Response('', { status: 405 });

export const NotAcceptable = () => new Response('', { status: 406 });

export const Conflict = <T = PlainObject>(body: BodyInit | T = '') => {
  const init = { status: 409 };
  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

// 5xx
export const InternalServerError = <T = PlainObject>(
  body: BodyInit | T = '',
) => {
  const init = { status: 500 };

  return isPlainObject<T>(body) || Array.isArray(body)
    ? JSON(body, init)
    : new Response(body, init);
};

// Special case (type-related)

export const HTML = (body: string | ReadableStream, headers = {}) =>
  new Response(body, {
    status: 200,
    headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
  });

export const Plain = (body?: BodyInit, init?: ResponseInit) => new Response(body, init);

// FIXME why `body` cannot be `PlainObject` -> ask Michal
export const JSON = (body: unknown, { status, headers }: ResponseInit) => {
  const json = globalThis.JSON.stringify(body, null, 2);

  return new Response(json, {
    status,
    headers: { ...headers || {}, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export const EventStream = (body: string | ReadableStream, headers = {}, status = 200) =>
  new Response(body, {
    status,
    headers: { ...headers, 'Content-Type': 'text/event-stream' },
  });