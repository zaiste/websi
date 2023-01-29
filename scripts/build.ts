import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./mod.ts",
    "./response.ts",
    "./route.ts",
    "./router.ts",
    "./util.ts",
  ],
  outDir: "./npm",
  scriptModule: false,
  esModule: true,
  shims: {
    custom: [{
      package: { name: "stream/web" },
      globalNames: ["ReadableStream"],
    }],
  },
  test: false,
  compilerOptions: {
    target: "ES2021",
    lib: ["es2021", "dom"]
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