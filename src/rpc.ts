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
   * ### Aria2 WebSocket Client
   *
   * aria2 provides JSON-RPC over HTTP and XML-RPC over HTTP interfaces that offer basically the same functionality. aria2 also provides JSON-RPC over WebSocket. JSON-RPC over WebSocket uses the same method signatures and response format as JSON-RPC over HTTP, but additionally provides server-initiated notifications. See JSON-RPC over WebSocket section for more information.
   *
   * **Events**
   * - WebSocket
   *    * `ws.open`
   *    * `ws.message`
   *    * `ws.close`
   * - Aria2 Notifications
   *    * `aria2.onDownloadStart`
   *    * `aria2.onDownloadPause`
   *    * `aria2.onDownloadStop`
   *    * `aria2.onDownloadComplete`
   *    * `aria2.onDownloadError`
   *    * `aria2.onBtDownloadComplete`;
   */
  export class Client extends Aria2ClientBaseClass<IAria2WSClientOptions> {
    /** @ignore  @internal */
    protected $ws: WebSocket;
    /** @ignore  @internal */
    protected $options!: IAria2ClientOptions & IAria2WSClientOptions;
    /** @ignore  @internal */
    protected $respCallbacks = new Map<
      string | number | undefined,
      (data: any) => void
    >();
    /** @ignore  @internal */
    protected $openCallbacks: Array<() => void> = [];
    /** @ignore  @internal */
    protected $opened = false;

    constructor(
      options: Readonly<IAria2ClientOptions & IAria2WSClientOptions>
    ) {
      super();
      this.$options = Object.assign({}, options);

      this.$ws = new WebSocketClient(
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

      this.$ws.onclose = () => {
        this.emit("ws.close");
        this.$opened = false;
        this.$openCallbacks = [];
      };
      this.$ws.onopen = () => {
        this.emit("ws.open");
        this.$opened = true;
        while (this.$openCallbacks.length > 0) {
          let cb = this.$openCallbacks.pop();
          if (cb != undefined && this.$ws.readyState == 1) {
            cb();
          }
        }
      };
      this.$ws.onmessage = (data) => {
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
            let cb = this.$respCallbacks.get(message[0].id);
            if (cb != undefined) {
              cb(message);
            }
            this.$respCallbacks.delete(message[0].id);
          } else if (
            message.id != undefined &&
            this.$respCallbacks.has(message?.id)
          ) {
            let cb = this.$respCallbacks.get(message.id);
            if (cb != undefined) {
              cb(message);
            }
            this.$respCallbacks.delete(message.id);
          } else if ((<IJsonRPCRequest>message).method != undefined) {
            switch ((<IJsonRPCRequest>message)?.method) {
              case "aria2.onDownloadStart":
                this.emit(
                  "aria2.onDownloadStart",
                  {},
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadPause":
                this.emit(
                  "aria2.onDownloadPause",
                  {},
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadStop":
                this.emit(
                  "aria2.onDownloadStop",
                  {},
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadComplete":
                this.emit(
                  "aria2.onDownloadComplete",
                  {},
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onDownloadError":
                this.emit(
                  "aria2.onDownloadError",
                  {},
                  ...((<IJsonRPCRequest>message).params ?? [])
                );
                break;
              case "aria2.onBtDownloadComplete":
                this.emit(
                  "aria2.onBtDownloadComplete",
                  {},
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

    protected $waitOpened = () =>
      new Promise<void>((r, j) => {
        if (this.$opened && this.$ws.readyState == 1) {
          r();
        } else if (this.$ws.readyState < 1 && this.$ws.readyState > 1) {
          j(this.$ws.readyState);
        } else {
          this.$openCallbacks.push(r);
        }
      });

    /**
     * ## Send raw data
     * @ignore  @internal
     * @param data Data to be sent
     */
    protected $sendRaw = (data: any) =>
      new Promise<void>((r, j) => {
        try {
          this.$ws.send(data);
        } catch (e) {
          j(e);
        }
      });

    /** @ignore  @internal */
    protected $sendJson = (method: string, ...params: any[]) =>
      new Promise<IJsonRPCResponse>(async (r, j) => {
        await this.$waitOpened();
        let id = uuid.v4();
        let msg: IJsonRPCRequest = {
          jsonrpc: "2.0",
          id,
          method,
          params: [] as any[],
        };
        if (this.$options?.auth?.secret != undefined) {
          msg.params.push("token:" + this.$options.auth.secret);
        }

        msg.params = [...msg.params, ...params];

        this.$respCallbacks.set(id, r);
        this.$sendRaw(JSON.stringify(msg)).catch(j);
      });

    /** @ignore  @internal */
    protected $systemMethods = new SystemMethods(this);

    public get system(): SystemMethods {
      return this.$systemMethods;
    }

    public async rawCall<T, R>(methods: string, ...args: T[]): Promise<R> {
      let resp = await this.$sendJson(methods, ...args);
      if (resp.error != undefined) {
        throw resp.error;
      } else {
        return (resp.result as unknown) as R;
      }
    }

    public async rawSend<T>(data: T): Promise<void> {
      return await this.$sendRaw(data);
    }

    public async getCreateOptions() {
      return Object.freeze(this.$options);
    }

    /**
     * Close the WebSocket Connection.
     * @param code Disconnect Code
     * @param data Some string
     */
    public async closeConnection<T extends string>(
      code?: number,
      data?: T
    ): Promise<void> {
      this.$ws.close(code, data);
      return;
    }
  }

  export class SystemMethods extends Aria2ClientSystemMethodsBaseClass<IAria2WSClientOptions> {
    async listMethods() {
      return (await this.$client.rawCall(
        "system.listMethods"
      )) as TAria2ClientMethodList;
    }
    async listNotifications() {
      return (await this.$client.rawCall(
        "system.listNotifications"
      )) as TAria2ClientNotificationList;
    }
    multicall<T0, T1>(...items: IAria2ClientMulticallItem[]) {
      return new Promise<TAria2ClientMulticallResult<T0>>(async (rr, j) => {
        let firstid = uuid.v4();
        let first = false;
        let sec: string[] = [];
        let options = await this.$client.getCreateOptions();
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

        await (this.$client as any).$waitOpened();
        (this.$client as any).$respCallbacks.set(
          firstid,
          (data: IJsonRPCResponse[]) => {
            let out: Promise<T0>[] = [];
            for (const d of data) {
              if (d.error != undefined) {
                out.push(Promise.reject(d.error));
              } else {
                out.push(Promise.resolve((d.result as unknown) as T0));
              }
            }
            rr(out);
          }
        );
        this.$client.rawSend(JSON.stringify(s)).catch(j);
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
    protected $options: IAria2ClientOptions & IAria2HttpClientOptions;
    /** @ignore  @internal */
    protected $system: SystemMethods;

    constructor(
      options: Readonly<IAria2ClientOptions & IAria2HttpClientOptions>
    ) {
      super();
      this.$options = options;
      this.$system = new SystemMethods(this);
    }
    public onDownloadStart(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public onDownloadPause(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public onDownloadStop(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public onDownloadComplete(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public onDownloadError(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public onBtDownloadStart(): Promise<IAria2NotificationEvent> {
      throw new Error("Method not implemented.");
    }
    public get system(): Aria2ClientSystemMethodsBaseClass<IAria2HttpClientOptions> {
      return this.$system;
    }
    public async rawCall<T, R>(methods: string, ...args: T[]): Promise<R> {
      let id = uuid.v4();
      let arg = [...args];
      if (this.$options?.auth?.secret != undefined) {
        arg.push((("token:" + this.$options.auth.secret) as unknown) as T);
      }
      let url = `${this.$options.protocol ?? "http"}://${this.$options.host}:${
        this.$options.port
      }/jsonrpc?method=${decodeURIComponent(methods)}&id=${decodeURIComponent(
        id
      )}&params=${btoa(JSON.stringify(arg))}`;
      let rsp = await axios(url, {
        method: "GET",
        ...this.$options.fetchOptions,
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
      return this.$options;
    }
  }
  export class SystemMethods extends Aria2ClientSystemMethodsBaseClass<IAria2HttpClientOptions> {
    public async multicall<T0, T1>(
      ...items: Readonly<IAria2ClientMulticallItem<T0>[]>
    ): Promise<TAria2ClientMulticallResult<T1>> {
      let rvers = {};
      let args: IJsonRPCRequest[] = [];
      let prs: TAria2ClientMulticallResult<T1> = [];
      let op = await this.$client.getCreateOptions();
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
      return await this.$client.rawCall<void, TAria2ClientMethodList>(
        "system.listMethods"
      );
    }
    public async listNotifications(): Promise<TAria2ClientNotificationList> {
      return await this.$client.rawCall<void, TAria2ClientNotificationList>(
        "system.listNotifications"
      );
    }
  }
}
