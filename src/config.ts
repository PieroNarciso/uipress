import type { Routes } from "./router";
import type { BuildOptions } from "vite";
const { NODE_ENV } = process.env;

export type Config = {
  mode: "production" | "development";
  vitePort: number;
  clearScreen: boolean;
  routes: Routes;
};

export const config: Config = {
  mode: NODE_ENV === "production" ? "production" : "development",
  vitePort: 3001,
  clearScreen: false,
  routes: [],
};

export const configRoutes = (routes: Routes) => {
  routes.forEach((route) => {
    config.routes.push(route);
  });
  config.routes.sort((a, b) => (a.path > b.path ? -1 : 1));
};

export type InputOptions = NonNullable<
  NonNullable<BuildOptions["rollupOptions"]>["input"]
>;

export const getViteHost = (config: Config) => {
  return `http://localhost:${config.vitePort}`;
};

export const setConfig = (c: Partial<Config>) => {
  Object.assign(config, c);
};

export const getConfig = () => {
  return config;
};
