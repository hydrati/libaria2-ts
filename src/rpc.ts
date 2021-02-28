import * as uuid from "uuid";
import { Base64 } from "./utils";
import {
  IAria2ClientOptions,
  IAria2Version,
  IAria2WSClientOptions,
  TAria2SaveSessionResult,
  TAria2ShutdownResult,
  IAria2ClientSystem,
  IJsonRPCResponse,
  IJsonRPCRequest,
  TAria2ClientMethodList,
  TAria2ClientNotificationList,
  IAria2ClientMulticallItem,
  TAria2ClientMulticallResult,
  IAria2ClientSessionInfo,
  TAria2ClientGID,
  Aria2ClientBaseClass,
  EAria2ChangePositionHow,
  IAria2DownloadStatus,
  IAria2FileStatus,
  IAria2GlobalStat,
  IAria2PeersInfo,
  IAria2UriStatus,
  TAria2ChangeUriResult,
  TAria2ClientInputOption,
  TAria2ServersInfo,
  TAria2PauseAllResult,
  TAria2ChangePositionResult,
  TAria2DownloadFileIndex,
  TAria2ChangeOptionResult,
  TAria2PurgeDownloadResult,
  TAria2RemoveDownloadResult,
  TAria2MethodNames,
} from "./adapter";
import { format } from "path";
import EventEmitter from "events";
import WebSocketClient from "ws";
import {
  intoIAria2DownloadStatus,
  intoIAria2FileStatus,
  intoIAria2PeersInfo,
  intoIAria2ServersInfoItem,
  fromTAria2ClientInputOption,
  intoTAria2ClientInputOption,
  intoIAria2GlobalStat,
} from "./parser";

export namespace Aria2 {
  /** Aria2 WebSocket */
  export namespace WebSocket {
    /**
     * ### Aria2 WebSocket Client
     *
     * aria2 provides JSON-RPC over HTTP and XML-RPC over HTTP interfaces that offer basically the same functionality. aria2 also provides JSON-RPC over WebSocket. JSON-RPC over WebSocket uses the same method signatures and response format as JSON-RPC over HTTP, but additionally provides server-initiated notifications. See JSON-RPC over WebSocket section for more information.
     */
    export class Client implements Aria2ClientBaseClass<IAria2WSClientOptions> {
      /** @ignore */
      protected $ws: WebSocketClient;
      /** @ignore */
      protected $options!: IAria2ClientOptions & IAria2WSClientOptions;
      /** @ignore */
      protected $respCallbacks = new Map<
        string | number | undefined,
        (data: any) => void
      >();
      /** @ignore */
      protected $openCallbacks: Array<() => void> = [];
      /** @ignore */
      protected $opened = false;
      /**
       * **Event Emitter**
       *
       * Events:
       * - WebSocket
       *  - `ws.open`
       *  - `ws.message`
       *  - `ws.close`
       * - Aria2 Notifications
       *  - `aria2.onDownloadStart`
       *  - `aria2.onDownloadPause`
       *  - `aria2.onDownloadStop`
       *  - `aria2.onDownloadComplete`
       *  - `aria2.onDownloadError`
       *  - `aria2.onBtDownloadComplete`;
       */
      public events = new EventEmitter({ captureRejections: true });
      /**
       * @constructor
       * @param options Options for creating a client.
       */
      constructor(
        options: Readonly<IAria2ClientOptions & IAria2WSClientOptions>
      ) {
        this.$options = Object.assign({}, options);

        this.$ws = new WebSocketClient(
          `${options.protocol ?? "ws"}://${options.host}:${options.port}${
            options.path ?? "/jsonrpc"
          }`,
          options.wsOptions ?? {}
        );

        this.$ws.on("close", () => {
          this.events.emit("ws.close");
          this.$opened = false;
          this.$openCallbacks = [];
        });
        this.$ws.on("open", () => {
          this.events.emit("ws.open");
          this.$opened = true;
          while (this.$openCallbacks.length > 0) {
            let cb = this.$openCallbacks.pop();
            if (cb != undefined && this.$ws.readyState == 1) {
              cb();
            }
          }
        });
        this.$ws.on("message", (data) => {
          try {
            this.events.emit("ws.message", data);
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
                  this.events.emit(
                    "aria2.onDownloadStart",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
                case "aria2.onDownloadPause":
                  this.events.emit(
                    "aria2.onDownloadPause",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
                case "aria2.onDownloadStop":
                  this.events.emit(
                    "aria2.onDownloadStop",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
                case "aria2.onDownloadComplete":
                  this.events.emit(
                    "aria2.onDownloadComplete",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
                case "aria2.onDownloadError":
                  this.events.emit(
                    "aria2.onDownloadError",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
                case "aria2.onBtDownloadComplete":
                  this.events.emit(
                    "aria2.onBtDownloadComplete",
                    ...((<IJsonRPCRequest>message).params ?? [])
                  );
                  break;
              }
            }
          } catch (e) {
            this.$errorHandle(e);
          }
        });
      }

      /**
       * This method adds a Metalink download by uploading a ".metalink" file. metalink is a base64-encoded string which contains the contents of the ".metalink" file. options is a struct and its members are pairs of option name and value. See Options below for more details. If position is given, it must be an integer starting from 0. The new download will be inserted at position in the waiting queue. If position is omitted or position is larger than the current size of the queue, the new download is appended to the end of the queue. This method returns an array of GIDs of newly registered downloads. If `--rpc-save-upload-metadata` is `true`, the uploaded data is saved as a file named hex string of SHA-1 hash of data plus ".metalink" in the directory specified by `--dir` option. E.g. a file name might be `0a3893293e27ac0490424c06de4d09242215f0a6.metalink`. If a file with the same name already exists, it is overwritten! If the file cannot be saved successfully or `--rpc-save-upload-metadata` is `false`, the downloads added by this method are not saved by `--save-session`.
       *
       * @example
       * ```ts
       * await aria2.addMetalink(".....");
       * ```
       * @returns TAria2ClientGID[]
       */
      public async addMetalink(
        metalink: string | Buffer,
        options?: IAria2ClientOptions,
        position?: number
      ): Promise<TAria2ClientGID[]> {
        if (metalink instanceof Buffer) metalink = metalink.toString("base64");
        let args: unknown[] = [metalink];
        if (options != undefined) args.push(options);
        if (options != undefined && position != undefined) args.push(position);
        else if (position != undefined) throw "Require `options`!";
        let resl = await this.$sendJson("aria2.addMetalink", ...args);
        if (resl.error != undefined) {
          throw resl.error;
        } else {
          return (resl.result as unknown) as TAria2ClientGID[];
        }
      }

      /**
       * This method removes the download denoted by gid (string). If the specified download is in progress, it is first stopped. The status of the removed download becomes removed. This method returns GID of `removed` download.
       *
       * The following examples remove a download with GID#2089b05ecca3d829.
       * @example
       * ```ts
       * await aria2.remove('2089b05ecca3d829')
       * ````
       * @returns TAria2ClientGID
       */
      public async remove(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
        let resp = await this.$sendJson("aria2.remove", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientGID;
        }
      }
      /**
       * This method removes the download denoted by gid. This method behaves just like `aria2.remove()` except that this method removes the download without performing any actions which take time, such as contacting BitTorrent trackers to unregister the download first.
       * @returns TAria2ClientGID
       */
      public async forceRemove(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
        let resp = await this.$sendJson("aria2.forceRemove", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientGID;
        }
      }
      /**
       * This method pauses the download denoted by gid (string). The status of paused download becomes `paused`. If the download was active, the download is placed in the front of waiting queue. While the status is `paused`, the download is not started. To change status to waiting, use the `aria2.unpause()` method. This method returns GID of paused download.
       * @returns TAria2ClientGID
       */
      public async pause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
        let resp = await this.$sendJson("aria2.pause", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientGID;
        }
      }
      /**
       * This method pauses the download denoted by gid. This method behaves just like `aria2.pause()` except that this method pauses downloads without performing any actions which take time, such as contacting BitTorrent trackers to unregister the download first.
       * @returns TAria2ClientGID
       */
      public async forcePause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
        let resp = await this.$sendJson("aria2.forcePause", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientGID;
        }
      }

      /**
       * This method is equal to calling `aria2.pause()` for every active/waiting download. This methods returns `OK`.
       * @returns TAria2PauseAllResult
       */
      public async pauseAll(): Promise<TAria2PauseAllResult> {
        let resp = await this.$sendJson("aria2.pauseAll");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2PauseAllResult;
        }
      }

      /**
       * This method is equal to calling `aria2.forcePause()` for every active/waiting download. This methods returns `OK`.
       * @returns TAria2PauseAllResult
       */
      public async forcePauseAll(): Promise<TAria2PauseAllResult> {
        let resp = await this.$sendJson("aria2.forcePauseAll");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2PauseAllResult;
        }
      }
      /**
       * This method changes the status of the download denoted by gid (string) from `paused` to `waiting`, making the download eligible to be restarted. This method returns the GID of the unpaused download.
       * @returns TAria2ClientGID
       */
      public async unpause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
        let resp = await this.$sendJson("aria2.unpause", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientGID;
        }
      }
      /**
       * This method is equal to calling `aria2.unpause()` for every paused download. This methods returns `OK`.
       * @returns TAria2PauseAllResult
       */
      public async unpauseAll(): Promise<TAria2PauseAllResult> {
        let resp = await this.$sendJson("aria2.unpauseAll");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2PauseAllResult;
        }
      }
      /**
       * This method returns the progress of the download denoted by gid (string). keys is an array of strings. If specified, the response contains only keys in the keys array. If keys is empty or omitted, the response contains all keys. This is useful when you just want specific keys and avoid unnecessary transfers. For example, `aria2.tellStatus("2089b05ecca3d829", ["gid", "status"])` returns the gid and status keys only. The response is a struct and contains following keys. Values are strings.
       * @returns Pick<IAria2DownloadStatus, T> | IAria2DownloadStatus
       */
      public async tellStatus(
        gid: TAria2ClientGID
      ): Promise<IAria2DownloadStatus>;
      public async tellStatus<T extends keyof IAria2DownloadStatus>(
        gid: TAria2ClientGID,
        keys: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>>;

      public async tellStatus<T extends keyof IAria2DownloadStatus>(
        gid: TAria2ClientGID,
        keys?: T[]
      ): Promise<Pick<IAria2DownloadStatus, T> | IAria2DownloadStatus> {
        if (keys != undefined) {
          let resp = await this.$sendJson("aria2.tellStatus", gid, keys);
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return intoIAria2DownloadStatus(resp.result) as Pick<
              IAria2DownloadStatus,
              T
            >;
          }
        } else {
          let resp = await this.$sendJson("aria2.tellStatus", gid);
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return intoIAria2DownloadStatus(
              resp.result
            ) as IAria2DownloadStatus;
          }
        }
      }
      /**
       * This method returns the URIs used in the download denoted by gid (string). The response is an array of structs and it contains following keys. Values are string.
       * @returns IAria2UriStatus[]
       */
      public async getUris(gid: TAria2ClientGID): Promise<IAria2UriStatus[]> {
        let resp = await this.$sendJson("aria2.getUris", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as IAria2UriStatus[];
        }
      }
      /**
       * This method returns the file list of the download denoted by gid (string). The response is an array of structs which contain following keys. Values are strings.
       * @returns IAria2FileStatus[]
       */
      public async getFiles(gid: TAria2ClientGID): Promise<IAria2FileStatus[]> {
        let resp = await this.$sendJson("aria2.getUris", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown[]).map(
            intoIAria2FileStatus
          ) as IAria2FileStatus[];
        }
      }
      /**
       * This method returns a list peers of the download denoted by gid (string). This method is for BitTorrent only. The response is an array of structs and contains the following keys. Values are strings.
       * @returns IAria2PeersInfo[]
       */
      public async getPeers(gid: TAria2ClientGID): Promise<IAria2PeersInfo[]> {
        let resp = await this.$sendJson("aria2.getPeers", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown[]).map(
            intoIAria2PeersInfo
          ) as IAria2PeersInfo[];
        }
      }
      /**
       * This method returns currently connected HTTP(S)/FTP/SFTP servers of the download denoted by gid (string). The response is an array of structs and contains the following keys. Values are strings.
       * @returns TAria2ServersInfo
       */
      public async getServers(
        gid: TAria2ClientGID
      ): Promise<TAria2ServersInfo> {
        let resp = await this.$sendJson("aria2.getPeers", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown[]).map(
            intoIAria2ServersInfoItem
          ) as TAria2ServersInfo;
        }
      }
      /**
       * This method returns a list of active downloads. The response is an array of the same structs as returned by the `aria2.tellStatus()` method. For the keys parameter, please refer to the `aria2.tellStatus()` method.
       * @returns IAria2DownloadStatus[] | Pick<IAria2DownloadStatus, T>[]
       */
      public async tellActive<T extends keyof IAria2DownloadStatus>(
        keys: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>[]>;
      public async tellActive(): Promise<IAria2DownloadStatus[]>;
      public async tellActive<T extends keyof IAria2DownloadStatus>(
        keys?: T[]
      ): Promise<IAria2DownloadStatus[] | Pick<IAria2DownloadStatus, T>[]> {
        if (keys != undefined) {
          let resp = await this.$sendJson("aria2.tellActive", keys);
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as Pick<IAria2DownloadStatus, T>[];
          }
        } else {
          let resp = await this.$sendJson("aria2.tellActive");
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as IAria2DownloadStatus[];
          }
        }
      }

      /**
       * This method returns a list of waiting downloads, including paused ones. offset is an integer and specifies the offset from the download waiting at the front. num is an integer and specifies the max. number of downloads to be returned. For the keys parameter, please refer to the `aria2.tellStatus()` method.
       *
       * If offset is a positive integer, this method returns downloads in the range of [offset, offset + num).
       *
       * offset can be a negative integer. `offset == -1` points last download in the waiting queue and offset == -2 points the download before the last download, and so on. Downloads in the response are in reversed order then.
       *
       * For example, imagine three downloads "A", "B" and "C" are waiting in this order. `aria2.tellWaiting(0, 1)` returns `["A"]`. `aria2.tellWaiting(1, 2)` returns `["B", "C"]`. `aria2.tellWaiting(-1, 2)` returns `["C", "B"]`.
       *
       * The response is an array of the same structs as returned by `aria2.tellStatus()` method.
       *
       * @returns Pick<IAria2DownloadStatus, T>[] | IAria2DownloadStatus[]
       */
      public async tellWaiting(
        offset: number,
        num: number
      ): Promise<IAria2DownloadStatus[]>;
      public async tellWaiting<T extends keyof IAria2DownloadStatus>(
        offset: number,
        num: number,
        keys: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>[]>;
      public async tellWaiting<T extends keyof IAria2DownloadStatus>(
        offset: number,
        num: number,
        keys?: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>[] | IAria2DownloadStatus[]> {
        if (keys != undefined) {
          let resp = await this.$sendJson(
            "aria2.tellWaiting",
            offset,
            num,
            keys
          );
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as Pick<IAria2DownloadStatus, T>[];
          }
        } else {
          let resp = await this.$sendJson("aria2.tellWaiting", offset, num);
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as IAria2DownloadStatus[];
          }
        }
      }
      /**
       * This method returns a list of stopped downloads. offset is an integer and specifies the offset from the least recently stopped download. num is an integer and specifies the max. number of downloads to be returned. For the keys parameter, please refer to the `aria2.tellStatus()` method.
       *
       * offset and num have the same semantics as described in the `aria2.tellWaiting()` method.
       *
       * The response is an array of the same structs as returned by the `aria2.tellStatus()` method.
       *
       * @returns Pick<IAria2DownloadStatus, T>[] | IAria2DownloadStatus[]
       */
      public async tellStopped(
        offset: number,
        num: number
      ): Promise<IAria2DownloadStatus[]>;
      public async tellStopped<T extends keyof IAria2DownloadStatus>(
        offset: number,
        num: number,
        keys: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>[]>;
      public async tellStopped<T extends keyof IAria2DownloadStatus>(
        offset: number,
        num: number,
        keys?: T[]
      ): Promise<Pick<IAria2DownloadStatus, T>[] | IAria2DownloadStatus[]> {
        if (keys != undefined) {
          let resp = await this.$sendJson(
            "aria2.tellStopped",
            offset,
            num,
            keys
          );
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as Pick<IAria2DownloadStatus, T>[];
          }
        } else {
          let resp = await this.$sendJson("aria2.tellStopped", offset, num);
          if (resp.error != undefined) {
            this.$errorHandle(resp.error);
            throw resp.error;
          } else {
            return (resp.result as unknown[]).map(
              intoIAria2DownloadStatus
            ) as IAria2DownloadStatus[];
          }
        }
      }
      /**
       * This method changes the position of the download denoted by gid in the queue. pos is an integer. how is a string. If how is `POS_SET`, it moves the download to a position relative to the beginning of the queue. If how is `POS_CUR`, it moves the download to a position relative to the current position. If how is `POS_END`, it moves the download to a position relative to the end of the queue. If the destination position is less than 0 or beyond the end of the queue, it moves the download to the beginning or the end of the queue respectively. The response is an integer denoting the resulting position. (See enum `EAria2ChangePositionHow`)
       *
       * For example, if GID#2089b05ecca3d829 is currently in position 3, `aria2.changePosition('2089b05ecca3d829', -1, EAria2ChangePositionHow.Cur)` will change its position to 2. Additionally `aria2.changePosition('2089b05ecca3d829', 0, EAria2ChangePositionHow.Set)` will change its position to 0 (the beginning of the queue).
       *
       * The following examples move the download GID#2089b05ecca3d829 to the front of the queue.
       * @example
       * ```ts
       * await aria2.changePosition('2089b05ecca3d829', 0, EAria2ChangePositionHow.Set);
       * ```
       * @returns TAria2ChangePositionResult
       */
      public async changePosition(
        gid: TAria2ClientGID,
        pos: number,
        how: EAria2ChangePositionHow
      ): Promise<TAria2ChangePositionResult> {
        let resp = await this.$sendJson("aria2.changePosition", gid, pos, how);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ChangePositionResult;
        }
      }
      /**
       * This method removes the URIs in delUris from and appends the URIs in addUris to download denoted by gid. delUris and addUris are lists of strings. A download can contain multiple files and URIs are attached to each file. fileIndex is used to select which file to remove/attach given URIs. fileIndex is 1-based. position is used to specify where URIs are inserted in the existing waiting URI list. position is 0-based. When position is omitted, URIs are appended to the back of the list. This method first executes the removal and then the addition. position is the position after URIs are removed, not the position when this method is called. When removing an URI, if the same URIs exist in download, only one of them is removed for each URI in delUris. In other words, if there are three URIs `http://example.org/aria2` and you want remove them all, you have to specify (at least) 3 `http://example.org/aria2` in delUris. This method returns a list which contains two integers. The first integer is the number of URIs deleted. The second integer is the number of URIs added.
       *
       * The following examples add the URI `http://example.org/file` to the file whose index is `1` and belongs to the download GID#2089b05ecca3d829.
       * @returns TAria2ChangeUriResult
       */
      public async changeUri(
        gid: TAria2ClientGID,
        fileIndex: TAria2DownloadFileIndex,
        delUris: string[],
        addUris: string[],
        position?: number
      ): Promise<TAria2ChangeUriResult> {
        let resp = await this.$sendJson(
          "aria2.changeUri",
          gid,
          fileIndex,
          delUris,
          addUris,
          position
        );
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ChangeUriResult;
        }
      }
      /**
       * This method returns options of the download denoted by gid. The response is a struct where keys are the names of options. The values are strings. Note that this method does not return options which have no default value and have not been set on the command-line, in configuration files or RPC methods.
       *
       * The following examples get options of the download GID#2089b05ecca3d829.
       * @returns TAria2ClientInputOption
       */
      public async getOption(
        gid: TAria2ClientGID
      ): Promise<TAria2ClientInputOption> {
        let resp = await this.$sendJson("aria2.getOption", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return intoTAria2ClientInputOption(resp.result as unknown);
        }
      }
      /**
       * This method changes options of the download denoted by gid (string) dynamically. options is a struct. The options listed in Input File subsection are available, **except** for following options:
       *
       * - `dry-run`
       * - `metalink-base-uri`
       * - `parameterized-uri`
       * - `pause`
       * - `piece-length`
       * - `rpc-save-upload-metadata`
       *
       * Except for the following options, changing the other options of active download makes it restart (restart itself is managed by aria2, and no user intervention is required):
       *
       * - `bt-max-peers`
       * - `bt-request-peer-speed-limit`
       * - `bt-remove-unselected-file`
       * - `force-save`
       * - `max-download-limit`
       * - `max-upload-limit`
       * This method returns OK for success.
       *
       * The following examples set the `max-download-limit` option to 20K for the download GID#2089b05ecca3d829.
       *
       * @example
       * ```ts
       * await aria2.changeOption(`2089b05ecca3d829`, {
       *     'max-download-limit': '20K'
       * });
       * ```
       *
       * @returns TAria2ChangeOptionResult
       */
      public async changeOption(
        gid: TAria2ClientGID,
        options: TAria2ClientInputOption
      ): Promise<TAria2ChangeOptionResult> {
        let resp = await this.$sendJson(
          "aria2.changeOption",
          gid,
          fromTAria2ClientInputOption(options)
        );
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ChangeOptionResult;
        }
      }
      /**
       * This method returns the global options. The response is a struct. Its keys are the names of options. Values are strings. Note that this method does not return options which have no default value and have not been set on the command-line, in configuration files or RPC methods. Because global options are used as a template for the options of newly added downloads, the response contains keys returned by the `aria2.getOption()` method.
       * @returns TAria2ClientInputOption
       */
      public async getGlobalOption(): Promise<TAria2ClientInputOption> {
        let resp = await this.$sendJson("aria2.getGlobalOption");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return intoTAria2ClientInputOption(resp.result as unknown);
        }
      }

      /**
       * This method changes global options dynamically. options is a struct. **The following options are available**:
       *
       * - `bt-max-open-files`
       * - `download-result`
       * - `keep-unfinished-download-result`
       * - `log`
       * - `log-level`
       * - `max-concurrent-downloads`
       * - `max-download-result`
       * - `max-overall-download-limit`
       * - `max-overall-upload-limit`
       * - `optimize-concurrent-downloads`
       * - `save-cookies`
       * - `save-session`
       * - `server-stat-of`
       *
       * In addition, options listed in the Input File subsection are available, **except for following options**: `checksum`, `index-out`, `out`, `pause` and s`elect-file`.
       *
       * With the log option, you can dynamically start logging or change log file. To stop logging, specify an empty string("") as the parameter value. Note that log file is always opened in append mode. This method returns OK for success.
       *
       * @returns TAria2ChangeOptionResult
       */
      public async changeGlobalOption(
        options: TAria2ClientInputOption
      ): Promise<TAria2ChangeOptionResult> {
        let resp = await this.$sendJson(
          "aria2.changeGlobalOption",
          fromTAria2ClientInputOption(options)
        );
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ChangeOptionResult;
        }
      }
      /**
       * This method returns global statistics such as the overall download and upload speeds.
       * @returns IAria2GlobalStat
       */
      public async getGlobalStat(): Promise<IAria2GlobalStat> {
        let resp = await this.$sendJson("aria2.getGlobalStat");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return intoIAria2GlobalStat(resp.result as unknown);
        }
      }
      /**
       * This method purges completed/error/removed downloads to free memory. This method returns `OK`.
       * @returns TAria2PurgeDownloadResult
       */
      public async purgeDownloadResult(): Promise<TAria2PurgeDownloadResult> {
        let resp = await this.$sendJson("aria2.purgeDownloadResult");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2PurgeDownloadResult;
        }
      }
      /**
       * This method removes a completed/error/removed download denoted by gid from memory. This method returns `OK` for success.
       *
       * The following examples remove the download result of the download GID#2089b05ecca3d829.
       *
       * @example
       * ```ts
       * await aria2.removeDownloadResult('2089b05ecca3d829');
       * ```
       *
       * @returns TAria2RemoveDownloadResult
       */
      public async removeDownloadResult(
        gid: TAria2ClientGID
      ): Promise<TAria2RemoveDownloadResult> {
        let resp = await this.$sendJson("aria2.removeDownloadResult", gid);
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2RemoveDownloadResult;
        }
      }

      /** @ignore */
      protected $errorHandle = (e: Error | object) => {
        console.error(e);
      };

      /**
       * ## Wait WebSocket Open
       * @ignore
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
       * @ignore
       * @param data Data to be sent
       */
      protected $sendRaw = (data: any) =>
        new Promise<void>((r, j) => {
          this.$ws.send(data, (e) => {
            if (e != undefined) {
              j(e);
            } else {
              r();
            }
          });
        });

      /** @ignore */
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
          await this.$sendRaw(JSON.stringify(msg)).catch(j);
        });

      /**
       * This method returns the version of aria2 and the list of enabled features. The response is a struct and contains following keys.
       *
       * @example
       * ```ts
       * await aria2.getVersion();
       * ```
       * @returns IAria2Version
       */
      public async getVersion(): Promise<IAria2Version> {
        let resp = await this.$sendJson("aria2.getVersion");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as IAria2Version;
        }
      }

      /**
       * This method shuts down aria2. This method returns `OK`.
       *
       * @example
       * ```ts
       * await aria2.shutdown();
       * ```
       * @returns TAria2ShutdownResult
       */
      public async shutdown(): Promise<TAria2ShutdownResult> {
        let resp = await this.$sendJson("aria2.shutdown");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ShutdownResult;
        }
      }

      /**
       * This method shuts down aria2. This method behaves like function `aria2.shutdown()` without performing any actions which take time, such as contacting BitTorrent trackers to unregister downloads first. This method returns `OK`.
       * @example
       * ```ts
       * await aria2.forceShutdown();
       * ```
       * @returns TAria2ShutdownResult
       */
      public async forceShutdown(): Promise<TAria2ShutdownResult> {
        let resp = await this.$sendJson("aria2.forceShutdown");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ShutdownResult;
        }
      }

      /**
       * This method saves the current session to a file specified by the `--save-session` option. This method returns `OK` if it succeeds.
       * @example
       * ```ts
       * await aria2.saveSession();
       * ```
       * @returns TAria2SaveSessionResult
       */
      public async saveSession(): Promise<TAria2SaveSessionResult> {
        let resp = await this.$sendJson("aria2.saveSession");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2SaveSessionResult;
        }
      }

      /**
       * This method returns session information. The response is a struct and contains following key.
       * @example
       * ```ts
       * await aria2.saveSession();
       * ```
       * @returns TAria2SaveSessionResult
       */
      public async getSessionInfo(): Promise<IAria2ClientSessionInfo> {
        let resp = await this.$sendJson("aria2.getSessioninfo");
        if (resp.error != undefined) {
          this.$errorHandle(resp.error);
          throw resp.error;
        } else {
          return (resp.result as unknown) as IAria2ClientSessionInfo;
        }
      }

      /**
       * This method adds a new download. uris is an array of HTTP/FTP/SFTP/BitTorrent URIs (strings) pointing to the same resource. If you mix URIs pointing to different resources, then the download may fail or be corrupted without aria2 complaining. When adding BitTorrent Magnet URIs, uris must have only one element and it should be BitTorrent Magnet URI. options is a struct and its members are pairs of option name and value. See Options below for more details. If position is given, it must be an integer starting from 0. The new download will be inserted at position in the waiting queue. If position is omitted or position is larger than the current size of the queue, the new download is appended to the end of the queue. This method returns the GID of the newly registered download.
       * @param position `>= 0`
       * @example
       * ```ts
       * await aria2.addUri('http://example.org/file', {}, 0);
       * ```
       * @returns TAria2ClientGID
       */
      public async addUri(
        uris: string[] | string,
        options?: TAria2ClientInputOption,
        position?: number
      ): Promise<TAria2ClientGID> {
        if (typeof uris == "string") uris = [uris];
        let args: unknown[] = [uris];
        if (options != undefined)
          args.push(fromTAria2ClientInputOption(options));
        if (options != undefined && position != undefined) args.push(position);
        else if (position != undefined) throw "Require `options`!";
        let resl = await this.$sendJson("aria2.addUri", ...args);
        if (resl.error != undefined) {
          throw resl.error;
        } else {
          return (resl.result as unknown) as TAria2ClientGID;
        }
      }

      /**
       * This method adds a BitTorrent download by uploading a ".torrent" file. If you want to add a BitTorrent Magnet URI, use the `aria2.addUri()` method instead. torrent must be a base64-encoded string containing the contents of the ".torrent" file. uris is an array of URIs (string). uris is used for Web-seeding. For single file torrents, the URI can be a complete URI pointing to the resource; if URI ends with /, name in torrent file is added. For multi-file torrents, name and path in torrent are added to form a URI for each file. options is a struct and its members are pairs of option name and value. See Options below for more details. If position is given, it must be an integer starting from 0. The new download will be inserted at position in the waiting queue. If position is omitted or position is larger than the current size of the queue, the new download is appended to the end of the queue. This method returns the GID of the newly registered download. If `--rpc-save-upload-metadata` is `true`, the uploaded data is saved as a file named as the hex string of SHA-1 hash of data plus ".torrent" in the directory specified by `--dir` option. E.g. a file name might be `0a3893293e27ac0490424c06de4d09242215f0a6.torrent`. If a file with the same name already exists, it is overwritten! If the file cannot be saved successfully or `--rpc-save-upload-metadata` is `false`, the downloads added by this method are not saved by `--save-session`.
       * @param position  `>= 0`
       * @example
       * ```ts
       * let torrent = fs.readFileSync('./file.torrent');
       * await aria2.addTorrent(torrent);
       * ```
       * @returns TAria2ClientGID
       */
      public async addTorrent(
        torrent: Buffer | string,
        uris?: string[] | string,
        options?: IAria2ClientOptions,
        position?: number
      ): Promise<TAria2ClientGID> {
        if (torrent instanceof Buffer) torrent = torrent.toString("base64");

        if (typeof uris == "string") uris = [uris];
        let args: unknown[] = [torrent, uris];
        if (options != undefined) args.push(options);
        if (options != undefined && position != undefined) args.push(position);
        else if (position != undefined) throw "Require `options`!";
        let resl = await this.$sendJson("aria2.addTorrent", ...args);
        if (resl.error != undefined) {
          throw resl.error;
        } else {
          return (resl.result as unknown) as TAria2ClientGID;
        }
      }

      /** @ignore */
      protected $systemMethods = new SystemMethods(
        this.$sendJson,
        this.$sendRaw,
        this.$options,
        this.$respCallbacks,
        this.$waitOpened
      );

      /**
       * ## Aria2 SystemMethods
       * - #### `system.multicall`
       * - #### `system.listMethods`
       * - #### `system.listNotifications`
       */
      public get system(): SystemMethods {
        return this.$systemMethods;
      }

      /**
       * **[Unsafe]**  Call any method with any params.
       * @param methods The RPC Method.
       * @param ...args  Your Params.
       * @example
       * ```ts
       * await aria2.rawCall('aria2.getVersion');
       * ```
       */
      public async rawCall<T, R>(
        methods: TAria2MethodNames,
        ...args: T[]
      ): Promise<R> {
        let resp = await this.$sendJson(methods, ...args);
        if (resp.error != undefined) {
          throw resp.error;
        } else {
          return (resp.result as unknown) as R;
        }
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

    export class SystemMethods implements IAria2ClientSystem {
      /** @ignore */
      private $sendJson;
      /** @ignore */
      private $sendRaw;
      /** @ignore */
      private $options;
      /** @ignore */
      private $respCallbacks;
      /** @ignore */
      private $waitOpened;
      /** @ignore */
      constructor(sendJson, sendRaw, options, respCallbacks, waitOpened) {
        this.$sendJson = sendJson;
        this.$respCallbacks = respCallbacks;
        this.$sendRaw = sendRaw;
        this.$options = options;
        this.$waitOpened = waitOpened;
      }
      /**
       * This method returns all the available RPC methods in an array of string. Unlike other methods, this method does not require secret token. This is safe because this method just returns the available method names.
       * @example
       * ```ts
       * await aria2.system.listMethods();
       * ```
       * @returns TAria2ClientMethodList
       */
      async listMethods() {
        let resp = await this.$sendJson("system.listMethods");
        if (resp.error != undefined) {
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientMethodList;
        }
      }

      /**
       * This method returns all the available RPC notifications in an array of string. Unlike other methods, this method does not require secret token. This is safe because this method just returns the available notifications names.
       * @example
       * ```ts
       * await aria2.system.listMethods();
       * ```
       * @returns TAria2ClientNotificationList
       */
      async listNotifications() {
        let resp = await this.$sendJson("system.listNotifications");
        if (resp.error != undefined) {
          throw resp.error;
        } else {
          return (resp.result as unknown) as TAria2ClientNotificationList;
        }
      }

      /**
       * This methods encapsulates multiple method calls in a single request. methods is an array of structs. The structs contain two keys: `methodName` and `params`. `methodName` is the method name to call and `params` is array containing parameters to the method call. This method returns an array of responses. The elements will be either a one-item array containing the return value of the method call or a struct of fault element if an encapsulated method call fails.
       * @example
       * ```ts
       * await aria2.system.multicall({
       *  methodName: "aria2.getVersion",
       *  params: []
       * }, {
       *  methodName: "system.listMethods",
       *  params: []
       *});
       * ```
       * @returns TAria2ClientMulticallResult
       */
      multicall(...items: IAria2ClientMulticallItem[]) {
        return new Promise<TAria2ClientMulticallResult>(async (rr, j) => {
          let firstid = uuid.v4();
          let first = false;
          let sec: string[] = [];
          if (this.$options?.auth?.secret != undefined) {
            sec.push(
              (("token:" + this.$options?.auth?.secret) as unknown) as string
            );
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

          await this.$waitOpened();
          this.$respCallbacks.set(firstid, (data: IJsonRPCResponse[]) => {
            let out: Promise<object>[] = [];
            for (const d of data) {
              if (d.error != undefined) {
                out.push(Promise.reject(d.error));
              } else {
                out.push(Promise.resolve((d.result as unknown) as object));
              }
            }
            rr(out);
          });
          await this.$sendRaw(JSON.stringify(s)).catch(j);
        });
      }
    }
  }
  export namespace Http {
    /**
     * ### Aria2 Http Client
     * **Note: Work in progress**
     *
     */
    export class Client /* implements Aria2ClientBaseClass */ {
      constructor(...anything) {
        throw new Error("Aria2 HttpClient WIP!");
      }
    }
  }
}
