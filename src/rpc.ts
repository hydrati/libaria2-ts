import * as uuid from "uuid";
import {
  IAria2ClientOptions,
  IAria2WSClientOptions,
  IJsonRPCResponse,
  IJsonRPCRequest,
  TAria2ClientMethodList,
  TAria2ClientNotificationList,
  IAria2ClientMulticallItem,
  TAria2ClientMulticallResult,
  Aria2ClientBaseClass,
  IAria2NotificationEvent,
} from "./adapter";
import { WebSocketClient, btoa } from "./polyfill";
import { isNode } from "./utils";
import {
  Aria2ClientSystemMethodsBaseClass,
  IAria2HttpClientOptions,
} from "./adapter";
import axios from "axios";

export namespace RpcWebSocket {
  /**
   * **Aria2 WebSocket Client**
   *
   * aria2 provides JSON-RPC over HTTP and XML-RPC over HTTP interfaces that offer basically the same functionality. aria2 also provides JSON-RPC over WebSocket. JSON-RPC over WebSocket uses the same method signatures and response format as JSON-RPC over HTTP, but additionally provides server-initiated notifications. See JSON-RPC over WebSocket section for more information.
   */
  export class Client extends Aria2ClientBaseClass<IAria2WSClientOptions> {
    /** @ignore  @internal */
    protected _conn: WebSocket;
    /** @ignore  @internal */
    protected _options!: IAria2ClientOptions & IAria2WSClientOptions;
    /** @ignore  @internal */
    protected _cbs = new Map<
      string | number | undefined,
      (data: any) => void
    >();
    /** @ignore  @internal */
    protected _open_cbs: Array<() => void> = [];
    /** @ignore  @internal */
    protected _opened = false;

    constructor(
      options: Readonly<IAria2ClientOptions & IAria2WSClientOptions>
    ) {
      super();
      this._options = Object.assign({}, options);

      this._conn = new WebSocketClient(
        `${options.protocol ?? "ws"}://${options.host}:${options.port}${
          options.path ?? "/jsonrpc"
        }`,
        (() => {
          if (isNode()) {
            return options.wsOptions ?? {};
          } else {
            return undefined;
          }
        })() as any
      );

      this._conn.onclose = () => {
        this.emit("ws.close");
        this._opened = false;
        this._open_cbs = [];
      };
      this._conn.onopen = () => {
        this.emit("ws.open");
        this._opened = true;
        while (this._open_cbs.length > 0) {
          let cb = this._open_cbs.pop();
          if (cb != undefined && this._conn.readyState == 1) {
            cb();
          }
        }
      };
      this._conn.onmessage = (data) => {
        if (data?.type == "message" || isNode()) {
          data = data.data;
        }
        try {
          this.emit("ws.message", data);
          let message:
            | IJsonRPCResponse
            | IJsonRPCResponse[]
            | IJsonRPCRequest = JSON.parse(data.toString());
          if (message instanceof Array) {
            let cb = this._cbs.get(message[0].id);
            if (cb != undefined) {
              cb(message);
            }
            this._cbs.delete(message[0].id);
          } else if (
            message.id != undefined &&
            this._cbs.has(message?.id)
          ) {
            let cb = this._cbs.get(message.id);
            if (cb != undefined) {
              cb(message);
            }
            this._cbs.delete(message.id);
          } else if ((<IJsonRPCRequest>message).method != undefined) {
            switch ((<IJsonRPCRequest>message)?.method) {
              case "aria2.onDownloadStart":
                this.emit(
                  "aria2.onDownloadStart",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadPause":
                this.emit(
                  "aria2.onDownloadPause",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadStop":
                this.emit(
                  "aria2.onDownloadStop",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadComplete":
                this.emit(
                  "aria2.onDownloadComplete",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadError":
                this.emit(
                  "aria2.onDownloadError",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onBtDownloadComplete":
                this.emit(
                  "aria2.onBtDownloadComplete",
                  
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
            }
          }
        } catch (e) {
          this.$errorHandle(e);
          throw e;
        }
      };
    }

    /** @ignore  @internal */
    protected $errorHandle<T>(e: T) {}

    /**
     * ## Wait WebSocket Open
     * @ignore  @internal
     * @returns Promise<void>
     */

    protected _waitOpened() {
      return new Promise<void>((r, j) => {
        if (this._opened && this._conn.readyState == 1) {
          r();
        } else if (this._conn.readyState < 1 && this._conn.readyState > 1) {
          j(this._conn.readyState);
        } else {
          this._open_cbs.push(r);
        }
      });
    }

    /**
     * ## Send raw data
     * @ignore  @internal
     * @param data Data to be sent
     */
    protected _sendRaw (data: any) {
      return new Promise<void>((r, j) => {
        try {
          this._conn.send(data);
        } catch (e) {
          j(e);
        }
      });
    }

    /** @ignore  @internal */
    protected _sendJson(method: string, ...params: any[]) {
      return new Promise<IJsonRPCResponse>(async (r, j) => {
        await this._waitOpened();
        let id = uuid.v4();
        let msg: IJsonRPCRequest = {
          jsonrpc: "2.0",
          id,
          method,
          params: [] as any[],
        };
        if (this._options?.auth?.secret != undefined) {
          msg.params.push("token:" + this._options.auth.secret);
        }

        msg.params = [...msg.params, ...params];

        this._cbs.set(id, r);
        this._sendRaw(JSON.stringify(msg)).catch(j);
      });
    }
    /** @ignore  @internal */
    protected _systemMethods = new SystemMethods(this);

    public get system(): SystemMethods {
      return this._systemMethods;
    }

    public async rawCall<T, R>(methods: string, ...args: T[]): Promise<R> {
      let resp = await this._sendJson(methods, ...args);
      if (resp.error != undefined) {
        throw resp.error;
      } else {
        return (resp.result as unknown) as R;
      }
    }

    public async rawSend<T>(data: T): Promise<void> {
      return await this._sendRaw(data);
    }

    public async getCreateOptions() {
      return Object.freeze(this._options);
    }

    /**
     * Close the WebSocket Connection.
     * @param code Disconnect Code
     * @param data Some string
     */
    public async close<T extends string>(
      code?: number,
      data?: T
    ): Promise<void> {
      this._conn.close(code, data);
      return;
    }

    public on(event: "ws.open", listener: () => any): this
    public on(event: "ws.close", listener: () => any): this
    public on(event: "ws.message", listener: (data: any) => any): this
    public on(event: "aria2.onDownloadStart", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: "aria2.onDownloadPause", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: "aria2.onDownloadStop", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: "aria2.onDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: "aria2.onDownloadError", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: "aria2.onBtDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public on(event: string, listener: (...args: any[]) => void): this {
      super.on(event, listener)
      return this
    }

    public once(event: "ws.open", listener: () => any): this
    public once(event: "ws.close", listener: () => any): this
    public once(event: "ws.message", listener: (data: any) => any): this
    public once(event: "aria2.onDownloadStart", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: "aria2.onDownloadPause", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: "aria2.onDownloadStop", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: "aria2.onDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: "aria2.onDownloadError", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: "aria2.onBtDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public once(event: string, listener: (...args: any[]) => void): this {
      super.once(event, listener)
      return this
    }

    public addListener(event: "ws.open", listener: () => any): this
    public addListener(event: "ws.close", listener: () => any): this
    public addListener(event: "ws.message", listener: (data: any) => any): this
    public addListener(event: "aria2.onDownloadStart", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: "aria2.onDownloadPause", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: "aria2.onDownloadStop", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: "aria2.onDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: "aria2.onDownloadError", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: "aria2.onBtDownloadComplete", listener: (ev: IAria2NotificationEvent) => any): this
    public addListener(event: string, listener: (...args: any[]) => void): this {
      super.on(event, listener)
      return this
    }
  }

  export class SystemMethods extends Aria2ClientSystemMethodsBaseClass<IAria2WSClientOptions> {
    async listMethods() {
      return (await this._client.rawCall(
        "system.listMethods"
      )) as TAria2ClientMethodList;
    }
    async listNotifications() {
      return (await this._client.rawCall(
        "system.listNotifications"
      )) as TAria2ClientNotificationList;
    }
    multicall<T>(...items: IAria2ClientMulticallItem[]) {
      return new Promise<TAria2ClientMulticallResult<T>>(async (rr, j) => {
        let firstid = uuid.v4();
        let first = false;
        let sec: string[] = [];
        let options = await this._client.getCreateOptions();
        if (options?.auth?.secret != undefined) {
          sec.push((("token:" + options?.auth?.secret) as unknown) as string);
        }
        let s: IJsonRPCRequest[] = [];
        for (const i of items) {
          if (first != true) {
            s.push({
              jsonrpc: "2.0",
              id: firstid,
              method: i.methodName,
              params: [...sec, ...i.params],
            });
            first = true;
          } else {
            s.push({
              jsonrpc: "2.0",
              id: uuid.v4(),
              method: i.methodName,
              params: [...sec, ...i.params],
            });
          }
        }

        await (this._client as any)._waitOpened();
        (this._client as any)._cbs.set(
          firstid,
          (data: IJsonRPCResponse[]) => {
            let out: Promise<T>[] = [];
            for (const d of data) {
              if (d.error != undefined) {
                out.push(Promise.reject(d.error));
              } else {
                out.push(Promise.resolve((d.result as unknown) as T));
              }
            }
            rr(out);
          }
        );
        this._client.rawSend(JSON.stringify(s)).catch(j);
      });
    }
  }
}
export namespace RpcHttp {
  /**
   * ### Aria2 Http Client
   *    **Events is not supported**
   */
  export class Client extends Aria2ClientBaseClass<IAria2HttpClientOptions> {
    /** @ignore  @internal */
    protected _options: IAria2ClientOptions & IAria2HttpClientOptions;
    /** @ignore  @internal */
    protected _system: SystemMethods;

    constructor(
      options: Readonly<IAria2ClientOptions & IAria2HttpClientOptions>
    ) {
      super();
      this._options = options;
      this._system = new SystemMethods(this);
    }
 
    public get system(): Aria2ClientSystemMethodsBaseClass<IAria2HttpClientOptions> {
      return this._system;
    }
    public async rawCall<T, R>(methods: string, ...args: T[]): Promise<R> {
      let id = uuid.v4();
      let arg = [...args];
      if (this._options?.auth?.secret != undefined) {
        arg.push((("token:" + this._options.auth.secret) as unknown) as T);
      }
      let url = `${this._options.protocol ?? "http"}://${this._options.host}:${
        this._options.port
      }/jsonrpc?method=${decodeURIComponent(methods)}&id=${decodeURIComponent(
        id
      )}&params=${btoa(JSON.stringify(arg))}`;
      let rsp = await axios(url, {
        method: "GET",
        ...this._options.fetchOptions,
      });
      let j: IJsonRPCResponse = rsp.data;
      if (j.error == undefined) {
        return (j.result as unknown) as R;
      } else {
        throw j.error;
      }
    }
    public async rawSend<T>(data: T): Promise<void> {
      throw new Error("Method not implemented.");
    }
    public async getCreateOptions(): Promise<
      Readonly<IAria2ClientOptions & IAria2HttpClientOptions>
    > {
      return this._options;
    }
  }
  export class SystemMethods extends Aria2ClientSystemMethodsBaseClass<IAria2HttpClientOptions> {
    public async multicall<T0, T1>(
      ...items: Readonly<IAria2ClientMulticallItem<T0>[]>
    ): Promise<TAria2ClientMulticallResult<T1>> {
      let rvers = {};
      let args: IJsonRPCRequest[] = [];
      let prs: TAria2ClientMulticallResult<T1> = [];
      let op = await this._client.getCreateOptions();
      for (const i of items) {
        let id = uuid.v4();
        let a: string[] = [];
        if (op?.auth?.secret != undefined) a.push(op?.auth?.secret);
        args.push({
          jsonrpc: "2.0",
          id,
          params: [...a, ...i.params],
          method: i.methodName,
        } as IJsonRPCRequest);
        prs.push(
          new Promise((r, j) => {
            rvers[id] = { r, j };
          })
        );
      }
      new Promise(async () => {
        let url = `${op.protocol ?? "http"}://${op.host}:${
          op.port
        }/jsonrpc?method=&id=&params=${btoa(JSON.stringify(args))}`;
        let rep = await axios(url, {
          method: "GET",
          ...op.fetchOptions,
        });
        for (const r of rep.data as IJsonRPCResponse[]) {
          if (r.id != undefined && rvers[r.id] != undefined) {
            if (r.error != undefined) {
              rvers[r.id].j(r.error);
            } else {
              rvers[r.id].r(r.result);
            }
          }
        }
      });
      return prs;
    }
    public async listMethods(): Promise<TAria2ClientMethodList> {
      return await this._client.rawCall<void, TAria2ClientMethodList>(
        "system.listMethods"
      );
    }
    public async listNotifications(): Promise<TAria2ClientNotificationList> {
      return await this._client.rawCall<void, TAria2ClientNotificationList>(
        "system.listNotifications"
      );
    }
  }
}
