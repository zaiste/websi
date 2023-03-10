import type { Handler, Middleware, Params, Pipeline, Routes, RequestExtension, _Request, } from './mod.ts';

import { HTTPMethod } from './mod.ts';
import { isHandler, isHandlerMapping, isPipeline, compose } from './util.ts';
import * as Response from './response.ts';
import { Router } from './router.ts';

const inferRequestValueType = (v: string): string | number | boolean => {
  if (v === '') {
    return true;
  } else if (v === 'true') {
    return true;
  } else if (v === 'false') {
    return false;
  } else if (!isNaN(Number(v))) {
    return +v;
  }
  return v;
};

const parseBody = async (request: Request) => {
  const { headers } = request;

  const buffer = request.body;

  if (!buffer) {
    return { params: {}, files: {} };
  }

  const contentType = headers.get('Content-Type')?.split(';')[0];

  switch (contentType) {
    case 'application/x-www-form-urlencoded': {
      const form = await request.formData();
      const params: Params = {};
      for (const [key, value] of form) {
        params[key] = inferRequestValueType(value as string);
      }
      return { params, files: {} };
    }
    case 'application/json': {
      const params = await request.json();
      return { params, files: {} };
    }
    case 'multipart/form-data': {
      const form = await request.formData();

      const params: Params = {};
      const files: Record<string, File> = {};
      for (const [key, value] of form) {
        if (value instanceof File) {
          // TODO add mimetype? encoding?
          files[key] = value;
        } else {
          params[key] = value;
        }
      }

      return { params, files };
    }
    default:
      return { params: {}, files: {} };
  }
};

const RouteFinder = (router: Router): Middleware => {
  return (nextHandler: Handler) =>
    async (request: Request & RequestExtension, arg1, arg2) => {
      const { method, url } = request;

      const pathname = new URL(url).pathname;
      const data = router.find(method, pathname) || router.find('ANY', pathname);

      if (data) {
        const { handler: foundHandler, params: pathParams } = data;

        const queryParams: Params = {};
        const { searchParams } = new URL(url);
        for (const [key, value] of searchParams) {
          queryParams[key] = inferRequestValueType(value);
        }

        const { files, params: bodyParams } = await parseBody(request.clone());

        request.params = { ...queryParams, ...pathParams, ...bodyParams };
        request.files = files;

        return await foundHandler(request, arg1, arg2);
      } else {
        return nextHandler(request, arg1, arg2);
      }
    };
};

export const Routing = (routes: Routes = []) => {
  const router = new Router();
  const middlewares: Middleware[] = [];

  const add = (
    method: HTTPMethod | 'ANY',
    path: string,
    ...fns: [...Middleware[], Handler]
  ) => {
    const action = fns.pop() as Handler;

    // pipeline is a handler composed over middlewares,
    // `action` function must be explicitly extracted from the pipeline
    // as it has different signature, thus cannot be composed
    const pipeline: Handler = fns.length === 0
      ? action
      : compose(...(fns as Middleware[]))(action) as Handler;

    router.add(method, path, pipeline);
  };

  for (const [path, unit] of routes) {
    if (isHandlerMapping(unit)) {
      const { middleware = [] } = unit;

      for (const [method, handler] of Object.entries(unit)) {
        if (method in HTTPMethod) {
          const handlerContainer: Pipeline = isPipeline(handler) ? handler : [handler];
          const flow: Pipeline = [...middleware, ...handlerContainer];
          add(method as HTTPMethod, path, ...flow);
        }
        // else: a key name undefined in the spec -> discarding
      }

      continue;
    }

    if (isPipeline(unit)) {
      add('ANY', path, ...unit);
      continue;
    }

    if (isHandler(unit)) {
      add('ANY', path, unit);
      continue;
    }
  }

  const NotFound: Handler = (_) => Response.NotFound();
  const pipeline = compose<Middleware, Handler>(...middlewares, RouteFinder(router))(NotFound);

  // deno-lint-ignore no-explicit-any
  return (req: Request, arg1: any, arg2: any) => {
    const request = req as _Request;
    request.params = {};
    request.files = {};

    return pipeline(request, arg1, arg2);
  };
};
