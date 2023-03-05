import type { Handler, HTTPMethod, Meta, Middleware, Pipeline, Route } from './mod.ts';

import { isPipeline } from './util.ts';

function createRoute(
  name: HTTPMethod,
  path: string,
  action: Handler | Pipeline,
  meta: Meta,
): Route {
  if (isPipeline(action)) {
    const h = action.pop() as Handler;
    return [
      path,
      {
        [name]: h,
        middleware: [...(action as Middleware[])],
        meta,
      },
    ];
  } else {
    return [path, { [name]: action, middleware: [], meta }];
  }
}

// use partial func application below

export function GET(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('GET', path, action, meta);
}

export function POST(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('POST', path, action, meta);
}

export function PATCH(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('PATCH', path, action, meta);
}

export function PUT(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('PUT', path, action, meta);
}

export function DELETE(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('DELETE', path, action, meta);
}

export function OPTIONS(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('OPTIONS', path, action, meta);
}

export function ANY(path: string, action: Handler | Pipeline, meta: Meta = {}) {
  return createRoute('ANY', path, action, meta)
}
