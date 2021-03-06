import { Base64, isNode } from "./utils";

export const WebSocketClient = (() => {
  if (globalThis.WebSocket != undefined) {
    return globalThis.WebSocket;
  } else {
    return require("ws") as typeof WebSocket;
  }
})();

export const btoa: (s: string) => string = (() => {
  if (isNode()) {
    return Base64.btoa;
  } else if (globalThis.btoa != undefined) {
    return globalThis.btoa;
  } else {
    throw new Error("`btoa()` is not defined!");
  }
})();

export const atob: (s: string) => string = (() => {
  if (isNode()) {
    return Base64.atob;
  } else if (globalThis.atob != undefined) {
    return globalThis.atob;
  } else {
    throw new Error("`atob()` is not defined!");
  }
})();
