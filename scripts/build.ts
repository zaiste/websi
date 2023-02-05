import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  packageManager: 'pnpm',
  entryPoints: [
    "./mod.ts",
    { name: "./response", path: "./response.ts" },
    { name: "./route", path: "./route.ts" },
    { name: "./router", path: "./router.ts" },
    { name: "./routing", path: "./routing.ts" },
    { name: "./util", path: "./util.ts" },
  ],
  outDir: "./npm",
  scriptModule: false,
  esModule: true,
  typeCheck: false,
  shims: {
    custom: [
      // {
      // package: {
      //   name: "urlpattern-polyfill",
      // },
      // globalNames: ["URLPattern"]
      // }
      // {
      //   package: { name: "stream/web" },
      //   globalNames: ["ReadableStream"],
      // }
    ],
  },
  test: false,
  compilerOptions: {
    target: "ES2021",
    lib: ["es2021", "dom", "dom.iterable"]
  },
  package: {
    name: "websi",
    version: Deno.args[0],
    description: "Web Server Interface: Universal HTTP abstraction for TypeScript",
    author: "Zaiste",
    license: "Apache-2.0",
    homepage: "https://websi.dev",
    repository: "https://github.com/zaiste/websi",
    bugs: {
      url: "https://github.com/zaiste/websi/issues"
    }
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");