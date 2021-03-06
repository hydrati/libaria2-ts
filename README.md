# [libaria2.ts](https://www.npmjs.com/package/libaria2-ts)

![npm bundle size](https://img.shields.io/bundlephobia/min/libaria2-ts?label=size&style=for-the-badge)
![GitHub repo file count](https://img.shields.io/github/directory-file-count/im-oxygen/libaria2-ts?style=for-the-badge)
![npm](https://img.shields.io/npm/dm/libaria2-ts?style=for-the-badge)
![GitHub Repo stars](https://img.shields.io/github/stars/im-oxygen/libaria2-ts?style=for-the-badge)


TypeScript (Node.js & Browser) library for [aria2](https://aria2.github.io/).

- [libaria2.ts](#libaria2ts)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
    - [Create client](#create-client)
    - [Methods](#methods)
  - [License](#license)

## Introduction
libaria2.ts uses [Aria2 JSON-RPC Interface](https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface) to control it.

## Features
- Node.js and browsers support
- Multiple Transports
  - [HTTP](https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface)
  - [WebSocket](https://aria2.github.io/manual/en/html/aria2c.html#json-rpc-over-websocket)
- Promise-based API
- Full-Typing, JSDoc

## Getting Started

Install this package
```
npm install --save libaria2-ts
```
or
```
yarn add libaria2-ts
```


Start aria2 with rpc, example
```
aria2c --enable-rpc --rpc-listen-all=true --rpc-allow-origin-all
```
~~or use TypeScript API~~ (deprecated)

## Usage

### Create client
```ts
import { WebSocket as Aria2WebSocket } from "libaria2-ts";
// or 
//     import { Http as Aria2Http } from "libaria2-ts";

const aria2 = new Aria2WebSocket({...});
// or
//     const aria2 = new Aria2Http({...});

```

Example options
```ts
{
  host: 'localhost',
  port: 6800,
  path: '/jsonrpc',
  auth: {
    secret: 'hello'
  }
}
```

### Methods
```ts
let ver = await aria2.getVersion();
/*
 * Output:
 * { version: '...', enableFeatues: [...] }
 */

const resl = await aria2.system.multicall(
  { methodName: 'aria2.getVersion', params: [] },
  { methodName: 'aria2.addUri', params: ['http://example.com/qwer.zip'] }
);
/*
 * Output:
 * Array<Promise<...>>
 */

let event = await aria2.when('aria2.onDownloadStart');
console.log(`Download ${event.gid} Started`);

// or:
aria2.when('aria2.onDownloadStart').then((event: IAria2NotificationEvent) => {
  console.log(`Download ${event.gid} Started`);
})

// or:
aria2.addEventListener('aria2.onDownloadStart', (event: IAria2NotificationEvent) => {
  console.log(`Download ${event.gid} Started`);
});

// or:
aria2.onDownloadStart().then((event: IAria2NotificationEvent) => {
  console.log(`Download ${event.gid} Started`);
}));



await aria2.closeConnection();

```

More methods, see [Aria2ClientBaseClient](./classes/adapter.aria2clientbaseclass.html)

## License
```plaintext
MIT License

Copyright (c) 2021 Oxygen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```