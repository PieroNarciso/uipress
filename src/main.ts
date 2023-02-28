import express from "express";
import core from "express-serve-static-core";
import fs from "fs";
import path from "path";
import vite from "vite";
import colors from "picocolors";
import { Routes } from "./router";
import type { BuildOptions } from "vite";

const { NODE_ENV } = process.env;

const configFilePath = path.resolve(process.cwd(), "uipress.config.ts");

if (fs.existsSync(configFilePath)) {
  import(configFilePath);
}

type Config = {
  mode: "production" | "development";
  vitePort: number;
  clearScreen: boolean;
  routes: Routes;
};

type InputOptions = NonNullable<
  NonNullable<BuildOptions["rollupOptions"]>["input"]
>;

const config: Config = {
  mode: NODE_ENV === "production" ? "production" : "development",
  vitePort: 3001,
  clearScreen: false,
  routes: [],
};

export const configRoutes = (routes: Routes) => {
  routes.forEach((route) => {
    config.routes.push(route);
  });
};

const getViteHost = (config: Config) => {
  return `http://localhost:${config.vitePort}`;
};

const info = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `${colors.dim(timestamp)} ${colors.bold(
      colors.cyan("ui-press")
    )} ${colors.green(message)}`
  );
};

const isStaticFilePath = (path: string) => {
  const result = path.match(/\.\w+$/);
  if (result) {
    return true;
  }
  return false;
};

const viteBuild = async () => {
  await vite.build();
};

const startDevServer = async (config: Config) => {
  const server = await vite.createServer({
    clearScreen: config.clearScreen,
    server: { port: config.vitePort },
  });

  await server.listen();
  info(`Vite is listening on ${colors.gray(getViteHost(config))}`);
};

const serveStatic = async (config: Config, app: core.Express) => {
  info(`Running in ${config.mode} mode`);
  if (config.mode === "production") {
    const viteConfig = await vite.resolveConfig({}, "build");
    const distPath = path.resolve(viteConfig.root, viteConfig.build.outDir);
    app.use(express.static(distPath));

    if (!fs.existsSync(distPath)) {
      info(colors.yellow(`Static files not found in ${distPath}`));

      await viteBuild();
    }
    return;
  }

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

  const layer = app._router.stack.pop();
  app._router.stack = [
    ...app._router.stack.slice(0, 2),
    layer,
    ...app._router.stack.slice(2),
  ];
};

const serverHTML = async (config: Config, app: core.Express) => {
  if (config.mode === "production") {
    const viteConfig = await vite.resolveConfig({}, "build");
    const distPath = path.resolve(viteConfig.root, viteConfig.build.outDir);

    app.use("*", (_, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
    return;
  }

  config.routes.forEach((route) => {
    app.get(route.path, async (req, res, next) => {
      if (isStaticFilePath(req.path)) return next();
      try {
        let requestedPath = req.path;
        if (!req.path.endsWith("/")) {
          res.redirect(`${req.path}/`);
          return;
        }
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
};

export const getViteRoutes = (): InputOptions => {
  const routes: InputOptions = {};

  for (const route of config.routes) {
    routes[route.name] = route.file;
  }

  return routes;
};

export const setConfig = (c: Partial<Config>) => {
  Object.assign(config, c);
};

export const getConfig = () => {
  return config;
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
