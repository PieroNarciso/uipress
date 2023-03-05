# UIPress

Tooling for integrating a frontend framework with and express backend using [Vite](https://vitejs.dev/)

## Getting Started


Create an application using [Vite cli](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)

Then install express and UIPress

```bash
npm install express @dxiorg/uipress
```

Create and express server

```ts
import express from "express";
import UIPress from "@dxiorg/uipress";

const app = express();
const PORT = 8080;

app.get("/message", (_, res) => {
  res.send("Hello World!");
});

UIPress.listen(app, PORT, () => console.log(`Server running on port ${PORT}`));
```

Create a configuration file in the root directory `uipress.config.js` or `uipress.config.cjs`

```js
const path = require("path");
const { setConfig } = require("@dxiorg/uipress");

const root = path.resolve(__dirname, "src/client/pages");

setConfig({
  routes: [
    { path: "/", file: path.resolve(root, "index.html"), name: "main" },
    {
      path: "/clients",
      file: path.resolve(root, "clients/index.html"),
      name: "clients",
    },
    {
      path: "/products",
      file: path.resolve(root, "products/index.html"),
      name: "products",
    }
  ],
});
```

Example of project structure

```
.
├── jsconfig.json
├── package.json
├── public
│   └── vite.svg
├── src
│   ├── client
│   │   ├── assets
│   │   │   └── svelte.svg
│   │   ├── lib
│   │   │   └── Counter.svelte
│   │   ├── pages
│   │   │   ├── clients
│   │   │   │   ├── App.svelte
│   │   │   │   ├── index.html
│   │   │   │   └── main.js
│   │   │   ├── index.html
│   │   │   ├── main.js
│   │   │   └── products
│   │   │       ├── App.svelte
│   │   │       ├── index.html
│   │   │       └── main.js
│   │   └── vite-env.d.ts
│   └── server
│       └── main.js
├── svelte.config.js
├── uipress.config.cjs
├── vite.config.js
```

Run the development server

```bash
$ npm run dev

or

$ yarn dev
```


Run for production

```bash
$ npm run build
$ npm run start

or

$ yarn build
$ yarn start
```
