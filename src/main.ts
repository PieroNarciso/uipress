import express from "express";
import core from "express-serve-static-core";
import fs from "fs";
import path from "path";
import vite from "vite";
import colors from "picocolors";
import { addTralingSlash, isStaticFilePath } from "./router";
import { info } from "./log";
import { getViteHost, config } from "./config";
import type { Config, InputOptions } from "./config";

export { setConfig } from "./config";

// Read config file path
const commonJsConfigFile = path.resolve(process.cwd(), "uipress.config.cjs");
if (fs.existsSync(commonJsConfigFile)) {
  import(commonJsConfigFile);
}
const moduleConfigFile = path.resolve(process.cwd(), "uipress.config.js");
if (fs.existsSync(moduleConfigFile)) {
  console.log("ASDJFLKASD")
  import(moduleConfigFile);
}

const startDevServer = async (config: Config) => {
  const server = await vite.createServer({
    clearScreen: config.clearScreen,
    server: { port: config.vitePort },
  });

  await server.listen();
  info(`Vite is listening on ${colors.gray(getViteHost(config))}`);
};

const serveStatic = async (config: Config, app: core.Express) => {
  info(`Running in ${config.mode} mode!`);
  if (config.mode === "production") {
    const viteConfig = await vite.resolveConfig({}, "build");
    const distPath = path.resolve(viteConfig.root, viteConfig.build.outDir);
    app.use(express.static(distPath));

    if (!fs.existsSync(distPath)) {
      info(colors.yellow(`Static files not found in ${distPath}`));

      await vite.build();
    }
  } else {
    app.use(async (req, res, next) => {
      try {
        if (!isStaticFilePath(req.path)) return next();
        const host = getViteHost(config);
        const url = `${host}${req.path}`;
        const response = await fetch(url);
        if (!response.ok) return next();
        return res.redirect(response.url);
      } catch (e) {
        next();
      }
    });
  }

  const layer = app._router.stack.pop();
  app._router.stack = [
    ...app._router.stack.slice(0, 2),
    layer,
    ...app._router.stack.slice(2),
  ];
};

const serverHTML = async (config: Config, app: core.Express) => {
  config.routes.sort((a, b) => (a.path > b.path ? -1 : 1));

  if (config.mode === "production") {
    const viteConfig = await vite.resolveConfig({}, "build");
    const distPath = path.resolve(viteConfig.root, viteConfig.build.outDir);

    config.routes.forEach((route) => {
      const routePath = `${addTralingSlash(route.path)}*`;
      app.get(routePath, async (_, res) => {
        const pathIndex = path.join(distPath, route.path, "index.html");
        res.sendFile(pathIndex);
      });
    });
  } else {
    config.routes.forEach((route) => {
      const routePath = `${addTralingSlash(route.path)}*`;
      app.get(routePath, async (req, res, next) => {
        if (isStaticFilePath(req.path)) return next();
        try {
          let requestedPath = req.path;
          const host = getViteHost(config);
          const url = `${host}${requestedPath}`;
          const response = await fetch(url);
          let content = await response.text();
          content = content.replace(
            /(\/@react-refresh|\/@vite\/client)/g,
            `${getViteHost(config)}$1`
          );
          res.header("Content-Type", "text/html").send(content);
        } catch (e) {
          next();
        }
      });
    });
  }
  console.log(app._router.stack)
};

export const getViteRoutes = (): InputOptions => {
  const routes: InputOptions = {};

  for (const route of config.routes) {
    routes[route.name] = route.file;
  }

  return routes;
};

export const listen = (
  app: core.Express,
  port: number,
  callback?: () => void
) => {
  return app.listen(port, async () => {
    await serveStatic(config, app);
    await serverHTML(config, app);
    if (config.mode === "development") await startDevServer(config);
    if (callback) callback();
  });
};

export function uiPressPlugin(): vite.PluginOption {
  return {
    name: "uipress-plugin",
    config: () => ({
      build: {
        rollupOptions: {
          input: getViteRoutes(),
        },
        emptyOutDir: true
      },
    }),
  };
}
