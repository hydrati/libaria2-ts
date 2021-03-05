import { Base64 } from "./utils";

export const WebSocketClient = (() => {
  if (globalThis.WebSocket != undefined) {
    return globalThis.WebSocket;
  } else {
    return require("ws") as typeof WebSocket;
  }
})();

export const HttpFetch: typeof fetch = () => {
  if (globalThis.fetch != undefined) {
    return globalThis.fetch;
  } else {
    return require("isomorphic-fetch");
  }
};

export const btoa: (s: string) => string = (() => {
  if (process?.versions?.node != undefined) {
    return Base64.btoa;
  } else if (globalThis.btoa != undefined) {
    return globalThis.btoa;
  } else {
    throw new Error("`btoa()` is not defined!");
  }
})();

export const atob: (s: string) => string = (() => {
  if (process?.versions?.node != undefined) {
    return Base64.atob;
  } else if (globalThis.atob != undefined) {
    return globalThis.atob;
  } else {
    throw new Error("`atob()` is not defined!");
  }
})();
