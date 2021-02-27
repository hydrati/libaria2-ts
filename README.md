# libaria2.ts
TypeScript (Node.js & ~~Browser~~(WIP) ) library for [aria2](https://aria2.github.io/).

- [libaria2.ts](#libaria2ts)
  - [Introduction](#introduction)
  - [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
    - [Create client](#create-client)
    - [Methods](#methods)

## Introduction
libaria2.ts uses [Aria2 JSON-RPC Interface](https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface) to control it.

## Features
- Node.js and ~~browsers support~~ (WIP)
- Multiple Transports
  - [HTTP](https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface)
  - [WebSocket](https://aria2.github.io/manual/en/html/aria2c.html#json-rpc-over-websocket)
- Promise-based API
- Full-Typing, JSDoc

# Getting Started
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
or use TypeScript API
```ts
import { Spawn } from 'libaria2-ts';
const aria2Srv = new Spawn.Aria2Process({
  aria2cPath: "<your aria2c path>",
});
await aria2Srv.spawn(); // Spawn Process
await aria2Srv.process.kill() // Kill Process
```

# Usage

### Create client
```ts
import { WebSocketClient as Aria2 } from 'libaria2-ts';
const aria2 = new Aria2({
  // Your Options...
});
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

aria2.events.on('aria2.onDownloadStart', () => {
  console.log("Download Started");
});

await aria2.shutdown();
// Output: "OK"

```