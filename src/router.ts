type Router = {
  path: string;
  file: string;
  name: string;
};

export type Routes = Router[];

export function addTralingSlash(path: string): string {
  if (!path.endsWith("/")) {
    path += "/";
  }
  return path;
}

export function removeTralingSlash(path: string): string {
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

export function isExactUIPressRoute(
  requestedPath: string,
  routerPath: string
): boolean {
  routerPath = removeTralingSlash(routerPath);
  if (requestedPath === routerPath) {
    return true;
  }
  routerPath = addTralingSlash(routerPath);
  if (requestedPath === routerPath) {
    return true;
  }
  return false;
}

export const isStaticFilePath = (path: string) => {
  const result = path.match(/\.\w+$/);
  if (result) {
    return true;
  }
  return false;
};
