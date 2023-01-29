export type PlainObject = Record<string, unknown> | Array<PlainObject>;

export type MaybePromise<T> = T | Promise<T>;

// deno-lint-ignore no-empty-interface
export interface Context {
  // explicitly empty for now
}

export interface Params {
  [name: string]: string | number | boolean | Params;
}
export interface RequestExtension {
  method: HTTPMethod
  params: Params;
  files: {
    [name: string]: File;
  };
}

export type Handler = <T extends Context>(request: Request & RequestExtension, context: T) => MaybePromise<Response>;
export type Middleware = (handler: Handler) => Handler;
export type Pipeline = [...Middleware[], Handler];
export type ReversedPipeline = [Handler, ...Middleware[]];

export interface Meta {
  summary?: string;
  description?: string;
  parameters?: Array<unknown>;
  responses?: Record<string, unknown>;
}
export interface RoutePaths {
  // deno-lint-ignore no-explicit-any
  [name: string]: any;
}
export interface RouteOptions {
  middleware?: Middleware[];
  meta?: Meta;
}
export interface HandlerMapping {
  GET?: Handler | Pipeline;
  POST?: Handler | Pipeline;
  PUT?: Handler | Pipeline;
  PATCH?: Handler | Pipeline;
  DELETE?: Handler | Pipeline;
  middleware?: Middleware[];
  meta?: Meta;
}

export type Route = [string, HandlerMapping | Handler | Pipeline, Route?];
export type Routes = Route[];

export const HTTPMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  DELETE: 'DELETE',
} as const;
export type HTTPMethod = typeof HTTPMethod[keyof typeof HTTPMethod];

export interface HandlerParams {
  handler: Handler;
  names: string[];
}

export interface HandlerParamsMap {
  [method: string]: HandlerParams;
}

export interface KeyValue {
  name: string;
  value: string;
}
