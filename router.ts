// This code is inspired by / derived from:
//
// Trek.js Router - fundon <cfddream@gmail.com> MIT License
// https://github.com/trekjs/router
//
// Hono TrieRouter - Yusuke Wada and Hono contributors MIT License
// https://github.com/honojs/hono/tree/main/src/router/trie-router

import { Handler, HTTPMethod, Params } from "./mod.ts";
import { segmentize } from "./util.ts";

type Placeholder = string | '*'

interface HandlerContainer<T = Handler> {
  handler: T
  rank: number
  route: string
}

export const unpackOptionalDynamicParam = (pathname: string) => {
  const match = pathname.match(/(^.+)(\/\:[^\/]+)\?$/)
  if (!match) return null

  const base = match[1]
  const optional = base + match[2]
  return [base, optional]
}

export const extractPlaceholder = (segment: string): Placeholder | null => {
  if (segment === '*') return '*';

  const match = segment.match(/^\:([^\{\}]+)$/)
  if (match) return match[1]

  return null
}

const hasDynamicParam = (name: string) => <T = Handler>(node: Node<T>): boolean =>
  node.placeholders.some((n) => n === name)
  || Object.values(node.children).some(hasDynamicParam(name))

export class Node<T = Handler> {
  children: Record<string, Node<T>> = {};

  routes: Record<string, HandlerContainer<T>> = {};
  placeholders: Placeholder[] = [];

  rank = 0;
  name = '';
  shouldCapture = false;

  insert(method: HTTPMethod, path: string, handler: T): Node<T> {
    this.name = `${method} ${path}`
    this.rank = ++this.rank

    // deno-lint-ignore no-this-alias
    let node: Node<T> = this

    const segments = segmentize(path)

    const parentPlaceholders: Placeholder[] = []

    for (const segment of segments) {
      if (Object.keys(node.children).includes(segment)) {
        parentPlaceholders.push(...node.placeholders)
        node = node.children[segment]
        continue
      }

      node.children[segment] = new Node()

      const placeholder = extractPlaceholder(segment)

      if (placeholder) {
        // not wildcard
        if (placeholder !== '*') {
          this.shouldCapture = true

          for (const name of parentPlaceholders) {
            if (name === placeholder) {
              throw new Error(`Named param label duplicated '${placeholder}' for ${method} ${path}`)
            }
          }
          if (Object.values(node.children).some(hasDynamicParam(placeholder))) {
            throw new Error(`Named param label duplicated '${placeholder}' for ${method} ${path}`)
          }
        }
        node.placeholders.push(placeholder)
        parentPlaceholders.push(...node.placeholders)
      }
      parentPlaceholders.push(...node.placeholders)
      node = node.children[segment]
      node.shouldCapture = this.shouldCapture
    }

    node.routes[method] = { handler, route: this.name, rank: this.rank }

    return node
  }

  search(method: HTTPMethod | "ANY", path: string) {
    const candidates: HandlerContainer<T>[] = []
    const params: Params = {}

    let nodes = [this] as Node<T>[];
    const segments = segmentize(path)

    const size = segments.length;
    for (let idx = 0; idx < size; idx++) {
      const segment = segments[idx];
      const isTerminal = idx === size - 1
      const temp: Node<T>[] = []
      let matched = false

      for (const node of nodes) {
        const next = node.children[segment]

        if (next) {
          if (isTerminal) {
            if (next.children['*']) {
              const found = next.children['*'].routes[method]
              if (found) candidates.push(found);
            }
            const found = next.routes[method];
            if (found) candidates.push(found)
            matched = true
          } else {
            temp.push(next)
          }
        }

        for (const name of node.placeholders) {
          if (name === '*') {
            const child = node.children['*']

            const found = child.routes[method]
            if (found) candidates.push(found)

            temp.push(child)

            continue
          }

          if (segment === '') continue

          if (isTerminal) {
            const found = node.children[`:${name}`].routes[method]
            if (found) candidates.push(found)
          } else {
            temp.push(node.children[`:${name}`])
          }

          if (!matched) {
            params[name] = segment
          } else {
            if (node.children[segment] && node.children[segment].shouldCapture) {
              params[name] = segment
            }
          }
        }
      }

      nodes = temp
    }

    if (candidates.length > 0) {
      const handler = candidates
        .sort((a, b) => a.rank - b.rank)
        .map((s) => s.handler)
        .shift()!

      return { handler, params }
    }

    return null;
  }
}


export class Router<T = Handler> {
  root: Node<T>

  constructor() {
    this.root = new Node()
  }

  add(method: HTTPMethod, path: string, handler: T) {
    const results = unpackOptionalDynamicParam(path)
    if (results) {
      const [basePath, optionalPath] = results;

      this.root.insert(method, basePath, handler)
      this.root.insert(method, optionalPath, handler)
    } else {
      this.root.insert(method, path, handler)
    }
  }

  find(method: HTTPMethod | "ANY", path: string) {
    return this.root.search(method, path)
  }
}