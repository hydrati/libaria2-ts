import * as Rpc from "./rpc";
import * as Adapter from "./adapter";
// import * as Spawn from "./spawn";
export const WebSocketClient = Rpc.Aria2.WebSocket.Client;
export const HttpClient = Rpc.Aria2.Http.Client;
export { Rpc, Adapter };
