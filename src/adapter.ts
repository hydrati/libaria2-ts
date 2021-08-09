import type WebSocket from "ws";
import { EventEmitter } from "events";
import {
  intoIAria2DownloadStatus,
  intoIAria2FileStatus,
  intoIAria2PeersInfo,
  intoIAria2ServersInfoItem,
  fromTAria2ClientInputOption,
  intoTAria2ClientInputOption,
  intoIAria2GlobalStat,
} from "./parser";
import { AxiosRequestConfig } from "axios";

export abstract class Aria2ClientBaseClass<T> extends EventEmitter {
  /**
   * @constructor
   * @param options Options for creating a client.
   */
  constructor() {
    super();
  }
  /**
   * ## Aria2 SystemMethods
   * - #### `system.multicall`
   * - #### `system.listMethods`
   * - #### `system.listNotifications`
   */
  public abstract get system(): Aria2ClientSystemMethodsBaseClass<T>;
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
    if (process.versions.node ?? false) {
      if (metalink instanceof Buffer) metalink = metalink.toString("base64");
    }
    let args: unknown[] = [metalink];
    if (options != undefined) args.push(options);
    if (options != undefined && position != undefined) args.push(position);
    else if (position != undefined) throw "Require `options`!";
    return await this.rawCall<unknown, TAria2ClientGID[]>(
      "aria2.addMetalink",
      ...args
    );
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
    return await this.rawCall<TAria2ClientGID, TAria2ClientGID>(
      "aria2.remove",
      gid
    );
  }
  /**
   * This method removes the download denoted by gid. This method behaves just like `aria2.remove()` except that this method removes the download without performing any actions which take time, such as contacting BitTorrent trackers to unregister the download first.
   * @returns TAria2ClientGID
   */
  public async forceRemove(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
    return await this.rawCall<TAria2ClientGID, TAria2ClientGID>(
      "aria2.forceRemove",
      gid
    );
  }
  /**
   * This method pauses the download denoted by gid (string). The status of paused download becomes `paused`. If the download was active, the download is placed in the front of waiting queue. While the status is `paused`, the download is not started. To change status to waiting, use the `aria2.unpause()` method. This method returns GID of paused download.
   * @returns TAria2ClientGID
   */
  public async pause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
    return await this.rawCall<TAria2ClientGID, TAria2ClientGID>(
      "aria2.pause",
      gid
    );
  }
  /**
   * This method pauses the download denoted by gid. This method behaves just like `aria2.pause()` except that this method pauses downloads without performing any actions which take time, such as contacting BitTorrent trackers to unregister the download first.
   * @returns TAria2ClientGID
   */
  public async forcePause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
    return await this.rawCall<TAria2ClientGID, TAria2ClientGID>(
      "aria2.forcePause",
      gid
    );
  }

  /**
   * This method is equal to calling `aria2.pause()` for every active/waiting download. This methods returns `OK`.
   * @returns TAria2PauseAllResult
   */
  public async pauseAll(): Promise<TAria2PauseAllResult> {
    return await this.rawCall<void, TAria2PauseAllResult>("aria2.pauseAll");
  }

  /**
   * This method is equal to calling `aria2.forcePause()` for every active/waiting download. This methods returns `OK`.
   * @returns TAria2PauseAllResult
   */
  public async forcePauseAll(): Promise<TAria2PauseAllResult> {
    return await this.rawCall<void, TAria2PauseAllResult>(
      "aria2.forcePauseAll"
    );
  }
  /**
   * This method changes the status of the download denoted by gid (string) from `paused` to `waiting`, making the download eligible to be restarted. This method returns the GID of the unpaused download.
   * @returns TAria2ClientGID
   */
  public async unpause(gid: TAria2ClientGID): Promise<TAria2ClientGID> {
    return await this.rawCall<TAria2ClientGID, TAria2ClientGID>(
      "aria2.unpause",
      gid
    );
  }
  /**
   * This method is equal to calling `aria2.unpause()` for every paused download. This methods returns `OK`.
   * @returns TAria2PauseAllResult
   */
  public async unpauseAll(): Promise<TAria2PauseAllResult> {
    return await this.rawCall<void, TAria2PauseAllResult>("aria2.unpauseAll");
  }
  /**
   * This method returns the progress of the download denoted by gid (string). keys is an array of strings. If specified, the response contains only keys in the keys array. If keys is empty or omitted, the response contains all keys. This is useful when you just want specific keys and avoid unnecessary transfers. For example, `aria2.tellStatus("2089b05ecca3d829", ["gid", "status"])` returns the gid and status keys only. The response is a struct and contains following keys. Values are strings.
   * @returns Pick<IAria2DownloadStatus, T> | IAria2DownloadStatus
   */
  public async tellStatus(gid: TAria2ClientGID): Promise<IAria2DownloadStatus>;
  public async tellStatus<T extends keyof IAria2DownloadStatus>(
    gid: TAria2ClientGID,
    keys: T[]
  ): Promise<Pick<IAria2DownloadStatus, T>>;

  public async tellStatus<T extends keyof IAria2DownloadStatus>(
    gid: TAria2ClientGID,
    keys?: T[]
  ): Promise<Pick<IAria2DownloadStatus, T> | IAria2DownloadStatus> {
    if (keys != undefined) {
      let resp = await this.rawCall<unknown, unknown>(
        "aria2.tellStatus",
        gid,
        keys
      );
      return intoIAria2DownloadStatus(resp) as Pick<IAria2DownloadStatus, T>;
    } else {
      let resp = await this.rawCall<unknown, unknown>("aria2.tellStatus", gid);

      return intoIAria2DownloadStatus(resp) as IAria2DownloadStatus;
    }
  }
  /**
   * This method returns the URIs used in the download denoted by gid (string). The response is an array of structs and it contains following keys. Values are string.
   * @returns IAria2UriStatus[]
   */
  public async getUris(gid: TAria2ClientGID): Promise<IAria2UriStatus[]> {
    return await this.rawCall<TAria2ClientGID, IAria2UriStatus[]>(
      "aria2.getUris",
      gid
    );
  }
  /**
   * This method returns the file list of the download denoted by gid (string). The response is an array of structs which contain following keys. Values are strings.
   * @returns IAria2FileStatus[]
   */
  public async getFiles(gid: TAria2ClientGID): Promise<IAria2FileStatus[]> {
    return await this.rawCall<TAria2ClientGID, IAria2FileStatus[]>(
      "aria2.getFiles",
      gid
    );
  }
  /**
   * This method returns a list peers of the download denoted by gid (string). This method is for BitTorrent only. The response is an array of structs and contains the following keys. Values are strings.
   * @returns IAria2PeersInfo[]
   */
  public async getPeers(gid: TAria2ClientGID): Promise<IAria2PeersInfo[]> {
    let resp = await this.rawCall<TAria2ClientGID, unknown[]>(
      "aria2.getPeers",
      gid
    );
    return resp.map(intoIAria2PeersInfo) as IAria2PeersInfo[];
  }
  /**
   * This method returns currently connected HTTP(S)/FTP/SFTP servers of the download denoted by gid (string). The response is an array of structs and contains the following keys. Values are strings.
   * @returns TAria2ServersInfo
   */
  public async getServers(gid: TAria2ClientGID): Promise<TAria2ServersInfo> {
    let resp = await this.rawCall<TAria2ClientGID, unknown[]>(
      "aria2.getServers",
      gid
    );

    return resp.map(intoIAria2ServersInfoItem) as TAria2ServersInfo;
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
      let resp = await this.rawCall<unknown, unknown[]>(
        "aria2.tellActive",
        keys
      );

      return resp.map(intoIAria2DownloadStatus) as Pick<
        IAria2DownloadStatus,
        T
      >[];
    } else {
      let resp = await this.rawCall<unknown, unknown[]>("aria2.tellActive");

      return resp.map(intoIAria2DownloadStatus) as IAria2DownloadStatus[];
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
      let resp = await this.rawCall<unknown, unknown[]>(
        "aria2.tellWaiting",
        offset,
        num,
        keys
      );

      return resp.map(intoIAria2DownloadStatus) as Pick<
        IAria2DownloadStatus,
        T
      >[];
    } else {
      let resp = await this.rawCall<unknown, unknown[]>(
        "aria2.tellWaiting",
        offset,
        num
      );

      return resp.map(intoIAria2DownloadStatus) as IAria2DownloadStatus[];
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
      let resp = await this.rawCall<unknown, unknown[]>(
        "aria2.tellStopped",
        offset,
        num,
        keys
      );

      return resp.map(intoIAria2DownloadStatus) as Pick<
        IAria2DownloadStatus,
        T
      >[];
    } else {
      let resp = await this.rawCall<unknown, unknown[]>(
        "aria2.tellStopped",
        offset,
        num
      );

      return resp.map(intoIAria2DownloadStatus) as IAria2DownloadStatus[];
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
    return (await this.rawCall<unknown, unknown>(
      "aria2.changePosition",
      gid,
      pos,
      how
    )) as TAria2ChangePositionResult;
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
    return (await this.rawCall<unknown, unknown>(
      "aria2.changeUri",
      gid,
      fileIndex,
      delUris,
      addUris,
      position
    )) as TAria2ChangeUriResult;
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
    let resp = await this.rawCall<TAria2ClientGID, unknown>(
      "aria2.getOption",
      gid
    );

    return intoTAria2ClientInputOption(resp);
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
    return (await this.rawCall<unknown, unknown>(
      "aria2.changeOption",
      gid,
      fromTAria2ClientInputOption(options)
    )) as TAria2ChangeOptionResult;
  }
  /**
   * This method returns the global options. The response is a struct. Its keys are the names of options. Values are strings. Note that this method does not return options which have no default value and have not been set on the command-line, in configuration files or RPC methods. Because global options are used as a template for the options of newly added downloads, the response contains keys returned by the `aria2.getOption()` method.
   * @returns TAria2ClientInputOption
   */
  public async getGlobalOption(): Promise<TAria2ClientInputOption> {
    let resp = await this.rawCall<void, unknown>("aria2.getGlobalOption");
    return intoTAria2ClientInputOption(resp);
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
    return (await this.rawCall(
      "aria2.changeGlobalOption",
      fromTAria2ClientInputOption(options)
    )) as TAria2ChangeOptionResult;
  }
  /**
   * This method returns global statistics such as the overall download and upload speeds.
   * @returns IAria2GlobalStat
   */
  public async getGlobalStat(): Promise<IAria2GlobalStat> {
    let resp = await this.rawCall<void, unknown>("aria2.getGlobalStat");
    return intoIAria2GlobalStat(resp);
  }
  /**
   * This method purges completed/error/removed downloads to free memory. This method returns `OK`.
   * @returns TAria2PurgeDownloadResult
   */
  public async purgeDownloadResult(): Promise<TAria2PurgeDownloadResult> {
    return (await this.rawCall<void, unknown>(
      "aria2.purgeDownloadResult"
    )) as TAria2PurgeDownloadResult;
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
    return (await this.rawCall<TAria2ClientGID, unknown>(
      "aria2.removeDownloadResult",
      gid
    )) as TAria2RemoveDownloadResult;
  }

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
    return (await this.rawCall("aria2.getVersion")) as IAria2Version;
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
    return (await this.rawCall("aria2.shutdown")) as TAria2ShutdownResult;
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
    return (await this.rawCall("aria2.forceShutdown")) as TAria2ShutdownResult;
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
    return (await this.rawCall("aria2.saveSession")) as TAria2SaveSessionResult;
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
    return (await this.rawCall(
      "aria2.getSessioninfo"
    )) as IAria2ClientSessionInfo;
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
    if (options != undefined) args.push(fromTAria2ClientInputOption(options));
    if (options != undefined && position != undefined) args.push(position);
    else if (position != undefined) throw "Require `options`!";
    return (await this.rawCall("aria2.addUri", ...args)) as TAria2ClientGID;
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
    return (await this.rawCall("aria2.addTorrent", ...args)) as TAria2ClientGID;
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
  public abstract rawCall<T, R>(methods: string, ...args: T[]): Promise<R>;
  /**
   * **[Unsafe, Don't `await` or  `.then`]**  Send Any Data
   * @param data Your Data, `Buffer`, `string`....
   * ```ts
   * await aria2.rawSend(JSON.stringify({}));
   * ```
   */
  public abstract rawSend<T>(data: T): Promise<void>;
  /**
   * **[Unsafe]** Get Create Options *(Readonly)*
   */
  public abstract getCreateOptions(): Promise<
    Readonly<IAria2ClientOptions & T>
  >;
  /**
   * When `aria2.onDownloadStart` return.
   */
  public onceDownloadStart(): Promise<IAria2NotificationEvent> {
    return new Promise((r) =>
      this.once("aria2.onDownloadStart", r)
    );
  }
  /**
   * When `aria2.onDownloadPause` return.
   */
  public onceDownloadPause(): Promise<IAria2NotificationEvent> {
    return new Promise((r) =>
      this.once("aria2.onDownloadPause", r)
    );
  }
  /**
   * When `aria2.onDownloadStop` return.
   */
  public onceDownloadStop(): Promise<IAria2NotificationEvent> {
    return new Promise((r) => this.once("aria2.onDownloadStop", r));
  }
  /**
   * When `aria2.onDownloadComplete` return.
   */
  public onceDownloadComplete(): Promise<IAria2NotificationEvent> {
    return new Promise((r) =>
      this.once("aria2.onDownloadComplete", r)
    );
  }
  /**
   * When `aria2.onDownloadError` return.
   */
  public onceDownloadError(): Promise<IAria2NotificationEvent> {
    return new Promise((r) =>
      this.once("aria2.onDownloadError", r)
    );
  }
  /**
   * When `aria2.onBtDownloadStart` return.
   */
  public onceBtDownloadStart(): Promise<IAria2NotificationEvent> {
    return new Promise((r) =>
      this.once("aria2.onBtDownloadStart", r)
    );
  }
}

export type TAria2RemoveDownloadResult = string;

export type TAria2PurgeDownloadResult = string;

export interface IAria2GlobalStat {
  /** Overall download speed (byte/sec). */
  downloadSpeed: BigInt;
  /** Overall upload speed(byte/sec). */
  uploadSpeed: BigInt;
  /** The number of active downloads. */
  numActive: number;
  /** The number of waiting downloads. */
  numWaiting: number;
  /** The number of stopped downloads in the current session. This value is capped by the `--max-download-result` option. */
  numStopped: number;
  /** The number of stopped downloads in the current session and not capped by the `--max-download-result` option. */
  numStoppedTotal: number;
}

export interface IAria2NotificationEvent {
  gid: string;
}

export type TAria2ChangeOptionResult = string;

export type TAria2DownloadFileIndex = number;

export type TAria2ChangePositionResult = number;

export type TAria2ChangeUriResult = number[];

export enum EAria2ChangePositionHow {
  Set = "POS_SET",
  Cur = "POS_CUR",
  End = "POS_END",
}

export interface IAria2ServerInfo {
  /** Original URI. */
  uri: string;
  /** This is the URI currently used for downloading. If redirection is involved, currentUri and uri may differ. */
  currentUri: string;
  /** Download speed (byte/sec) */
  downloadSpeed: BigInt;
}

export interface IAria2ServersInfoItem {
  /** Index of the file, starting at 1, in the same order as files appear in the multi-file metalink. */
  index: number;
  /** A list of structs. */
  servers: IAria2ServerInfo[];
}

export type TAria2ServersInfo = IAria2ServersInfoItem[];

export enum EAria2DownloadState {
  Active = "active",
  Waiting = "waiting",
  Paused = "paused",
  Error = "error",
  Complete = "complete",
  Removed = "removed",
}

export interface IAria2PeersInfo {
  /** `true` if aria2 is choking the peer. Otherwise `false`. */
  amChoking: boolean;
  /** Hexadecimal representation of the download progress of the peer. The highest bit corresponds to the piece at index 0. Set bits indicate the piece is available and unset bits indicate the piece is missing. Any spare bits at the end are set to zero. */
  bitfield: string | string[];
  /** Download speed (byte/sec) that this client obtains from the peer. */
  downloadSpeed: BigInt;
  /** IP address of the peer. */
  ip: string;
  /** `true` if the peer is choking aria2. Otherwise `false`. */
  peerChoking: boolean;
  /** Percent-encoded peer ID. */
  peerId: string;
  /** Port number of the peer. */
  port: number;
  /** `true` if this peer is a seeder. Otherwise `false`. */
  seeder: boolean;
  /** Upload speed(byte/sec) that this client uploads to the peer. */
  uploadSpeed: BigInt;
}

export interface IAria2DownloadStatus {
  /** GID of the download. */
  gid: TAria2ClientGID;
  /** `active` for currently downloading/seeding downloads. `waiting` for downloads in the queue; download is not started. paused for `paused` downloads. `error` for downloads that were stopped because of error. `complete` for stopped and completed downloads. `removed` for the downloads removed by user. */
  status: EAria2DownloadState;
  /** Total length of the download in bytes. */
  totalLength: BigInt;
  /** Completed length of the download in bytes. */
  completedLength: BigInt;
  /** Uploaded length of the download in bytes. */
  uploadLength: BigInt;
  /** Hexadecimal representation of the download progress. The highest bit corresponds to the piece at index 0. Any set bits indicate loaded pieces, while unset bits indicate not yet loaded and/or missing pieces. Any overflow bits at the end are set to zero. When the download was not started yet, this key will not be included in the response. */
  bitfield: string | string[];
  /** Download speed of this download measured in bytes/sec. */
  downloadSpeed: BigInt;
  /** Upload speed of this download measured in bytes/sec. */
  uploadSpeed: BigInt;
  /** InfoHash. BitTorrent only. */
  infoHash?: string;
  /** The number of seeders aria2 has connected to. BitTorrent only. */
  numSeeders?: BigInt;
  /** `true` if the local endpoint is a seeder. Otherwise `false`. BitTorrent only. */
  seeder?: boolean;
  /** Piece length in bytes. */
  pieceLength: BigInt;
  /** The number of pieces. */
  numPieces: BigInt;
  /** The number of peers/servers aria2 has connected to */
  connections: BigInt;
  /** The code of the last error for this item, if any. The value is a string. The error codes are defined in the [EXIT STATUS](https://aria2.github.io/manual/en/html/aria2c.html#id1) section. This value is only available for stopped/completed downloads. */
  errorCode?: number;
  /** The (hopefully) human readable error message associated to `errorCode`. */
  errorMessage?: string;
  /** List of GIDs which are generated as the result of this download. For example, when aria2 downloads a Metalink file, it generates downloads described in the Metalink (see the `--follow-metalink` option). This value is useful to track auto-generated downloads. If there are no such downloads, this key will not be included in the response. */
  followedBy?: TAria2ClientGID | TAria2ClientGID[];
  /** The reverse link for `followedBy`. A download included in `followedBy` has this object's GID in its `following` value */
  following?: TAria2ClientGID | TAria2ClientGID[];
  /** GID of a parent download. Some downloads are a part of another download. For example, if a file in a Metalink has BitTorrent resources, the downloads of ".torrent" files are parts of that parent. If this download has no parent, this key will not be included in the response. */
  belongsTo?: TAria2ClientGID | TAria2ClientGID[];
  /** Directory to save files. */
  dir: string;
  /** Returns the list of files. The elements of this list are the same structs used in `aria2.getFiles()` method. */
  files: IAria2FileStatus[];
  /** Struct which contains information retrieved from the .torrent (file). BitTorrent only. */
  bittorrent?: IAria2DownloadBitTorrentStatus;
}

export interface IAria2DownloadBitTorrentStatus {
  /** List of lists of announce URIs. If the torrent contains `announce` and no `announce-list`, `announce` is converted to the `announce-list` format. */
  announceList?: any;
  /** The comment of the torrent. `comment.utf-8` is used if available. */
  comment?: string;
  /** The creation time of the torrent. The value is an integer since the epoch, measured in seconds. */
  creationDate?: BigInt;
  /** File mode of the torrent. The value is either `single` or `multi`. */
  mode: EAria2DownloadBitTorrentMode;
  /** Struct which contains data from Info dictionary. */
  info?: IAria2DownloadBitTorrentInfo;
}

export interface IAria2DownloadBitTorrentInfo {
  /** name in info dictionary. `name.utf-8` is used if available. */
  name?: string;
}

export interface IAria2FileStatus {
  /** Index of the file, starting at 1, in the same order as files appear in the multi-file torrent. */
  index: number;
  /** File path. */
  path: string;
  /** File size in bytes. */
  length: BigInt;
  /** Completed length of this file in bytes. Please note that it is possible that sum of `completedLength` is less than the `completedLength` returned by the `aria2.tellStatus()` method. This is because completedLength in `aria2.getFiles()` only includes completed pieces. On the other hand, completedLength in `aria2.tellStatus()` also includes partially completed pieces. */
  completedLength: BigInt;
  /** `true` if this file is selected by `--select-file` option. If `--select-file` is not specified or this is single-file torrent or not a torrent download at all, this value is always `true`. Otherwise `false`. */
  selected: boolean;
  /** Returns a list of URIs for this file. The element type is the same struct used in the `aria2.getUris()` method. */
  uris: IAria2UriStatus[];
}

export enum EAria2UriStatusEnum {
  /** The URI is in use. */
  Waiting = "waiting",
  /** The URI is still waiting in the queue. */
  Used = "used",
}

export interface IAria2UriStatus {
  /** `used` if the URI is in use. `waiting` if the URI is still waiting in the queue. */
  status: EAria2UriStatusEnum;
  /** URI */
  uri: string;
}

export enum EAria2DownloadBitTorrentMode {
  /** Single File */
  Single = "single",
  /** Multi File */
  Multi = "multi",
}

export interface IJsonRPCRequest {
  jsonrpc: "2.0" | "1.0";
  id?: string | number;
  method: string;
  params: any[];
}

export interface IJsonRPCResponse {
  jsonrpc: "2.0" | "1.0";
  id?: string | number;
  result?: object;
  error?: object;
}

export interface IAria2Version {
  /** List of enabled features. Each feature is given as a string. */
  enabledFeatures: string[];
  /** Version number of aria2 as a string. */
  version: string;
}

export type TAria2ShutdownResult = string;
export type TAria2SaveSessionResult = string;
export type TAria2PauseAllResult = string;
export type TAria2PauseResult = string;

export interface IAria2ClientOptions {
  host: string;
  port: number;
  path?: string;
  auth?: {
    user?: string;
    passwd?: string;
    secret?: string;
  };
}

export abstract class Aria2ClientSystemMethodsBaseClass<T> {
  /** @ignore */
  protected $client: Aria2ClientBaseClass<T>;
  /** @ignore */
  constructor(client: Aria2ClientBaseClass<T>) {
    this.$client = client;
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
  public abstract multicall<T0, T1>(
    ...items: Readonly<IAria2ClientMulticallItem<T0>[]>
  ): Promise<TAria2ClientMulticallResult<T1>>;
  /**
   * This method returns all the available RPC methods in an array of string. Unlike other methods, this method does not require secret token. This is safe because this method just returns the available method names.
   * @example
   * ```ts
   * await aria2.system.listMethods();
   * ```
   * @returns TAria2ClientMethodList
   */
  public abstract listMethods(): Promise<TAria2ClientMethodList>;
  /**
   * This method returns all the available RPC notifications in an array of string. Unlike other methods, this method does not require secret token. This is safe because this method just returns the available notifications names.
   * @example
   * ```ts
   * await aria2.system.listMethods();
   * ```
   * @returns TAria2ClientNotificationList
   */
  public abstract listNotifications(): Promise<TAria2ClientNotificationList>;
}

export type TAria2ClientMethodList = (string | TAria2MethodNames)[];

export type TAria2ClientNotificationList = (
  | string
  | TAria2ClientNotificationNames
)[];

export type TAria2ClientMulticallResult<T> = Array<Promise<T>>;

export interface IAria2ClientMulticallItem<T = unknown> {
  methodName: TAria2MethodNames;
  params: T[];
}

export interface IAria2ClientSessionInfo {
  /** Session ID, which is generated each time when aria2 is invoked. */
  sessionId: string;
}

export interface IAria2WSClientOptions {
  protocol?: "ws" | "wss";
  wsOptions?: WebSocket.ClientOptions;
}

export interface IAria2HttpClientOptions {
  protocol?: "http" | "https";
  fetchOptions?: Readonly<AxiosRequestConfig>;
}

export interface IAria2RpcOptions {
  rpc: {
    port: number;
    maxRequestSize?: number;
    listenAll?: boolean;
    allowOriginAll?: boolean;
  };
  auth?: {
    user?: string;
    passwd?: string;
    secret?: string;
  };
  secure?: {
    certificate: string;
    privateKey: string;
    useSecure: boolean;
  };
  other?: {
    saveUploadMetadata?: boolean;
    pause?: boolean;
    pauseMetadata?: boolean;
  };
}

export type TAria2AdditionalArgs = string[];
export type TAria2AdditionalOptions = Map<string, string | boolean | number>;

export interface IAria2SpawnOptions {
  addArgs?: TAria2AdditionalArgs;
  addOptions?: TAria2AdditionalOptions;
  rpcOptions?: IAria2RpcOptions;
  aria2cPath: string;
}

// The Method Names
export type TAria2MethodNames =
  | "aria2.addUri"
  | "aria2.addTorrent"
  | "aria2.getPeers"
  | "aria2.addMetalink"
  | "aria2.remove"
  | "aria2.pause"
  | "aria2.forcePause"
  | "aria2.pauseAll"
  | "aria2.forcePauseAll"
  | "aria2.unpause"
  | "aria2.unpauseAll"
  | "aria2.forceRemove"
  | "aria2.changePosition"
  | "aria2.tellStatus"
  | "aria2.getUris"
  | "aria2.getFiles"
  | "aria2.getServers"
  | "aria2.tellActive"
  | "aria2.tellWaiting"
  | "aria2.tellStopped"
  | "aria2.getOption"
  | "aria2.changeUri"
  | "aria2.changeOption"
  | "aria2.getGlobalOption"
  | "aria2.changeGlobalOption"
  | "aria2.purgeDownloadResult"
  | "aria2.removeDownloadResult"
  | "aria2.getVersion"
  | "aria2.getSessionInfo"
  | "aria2.shutdown"
  | "aria2.forceShutdown"
  | "aria2.getGlobalStat"
  | "aria2.saveSession"
  | "system.multicall"
  | "system.listMethods"
  | "system.listNotifications";

// Input Option Item Names
export type TAria2ClientInputOptionNames =
  | "all-proxy"
  | "all-proxy-passwd"
  | "all-proxy-user"
  | "allow-overwrite"
  | "allow-piece-length-change"
  | "always-resume"
  | "async-dns"
  | "auto-file-renaming"
  | "bt-enable-hook-after-hash-check"
  | "bt-enable-lpd"
  | "bt-exclude-tracker"
  | "bt-external-ip"
  | "bt-force-encryption"
  | "bt-hash-check-seed"
  | "bt-load-saved-metadata"
  | "bt-max-peers"
  | "bt-metadata-only"
  | "bt-min-crypto-level"
  | "bt-prioritize-piece"
  | "bt-remove-unselected-file"
  | "bt-request-peer-speed-limit"
  | "bt-require-crypto"
  | "bt-save-metadata"
  | "bt-seed-unverified"
  | "bt-stop-timeout"
  | "bt-tracker"
  | "bt-tracker-connect-timeout"
  | "bt-tracker-interval"
  | "bt-tracker-timeout"
  | "check-integrity"
  | "checksum"
  | "conditional-get"
  | "connect-timeout"
  | "content-disposition-default-utf8"
  | "continue"
  | "dir"
  | "dry-run"
  | "enable-http-keep-alive"
  | "enable-http-pipelining"
  | "enable-mmap"
  | "enable-peer-exchange"
  | "file-allocation"
  | "follow-metalink"
  | "follow-torrent"
  | "force-save"
  | "ftp-passwd"
  | "ftp-pasv"
  | "ftp-proxy"
  | "ftp-proxy-passwd"
  | "ftp-proxy-user"
  | "ftp-reuse-connection"
  | "ftp-type"
  | "ftp-user"
  | "gid"
  | "hash-check-only"
  | "header"
  | "http-accept-gzip"
  | "http-auth-challenge"
  | "http-no-cache"
  | "http-passwd"
  | "http-proxy"
  | "http-proxy-passwd"
  | "http-proxy-user"
  | "http-user"
  | "https-proxy"
  | "https-proxy-passwd"
  | "https-proxy-user"
  | "index-out"
  | "lowest-speed-limit"
  | "max-connection-per-server"
  | "max-download-limit"
  | "max-file-not-found"
  | "max-mmap-limit"
  | "max-resume-failure-tries"
  | "max-tries"
  | "max-upload-limit"
  | "metalink-base-uri"
  | "metalink-enable-unique-protocol"
  | "metalink-language"
  | "metalink-location"
  | "metalink-os"
  | "metalink-preferred-protocol"
  | "metalink-version"
  | "min-split-size"
  | "no-file-allocation-limit"
  | "no-netrc"
  | "no-proxy"
  | "out"
  | "parameterized-uri"
  | "pause"
  | "pause-metadata"
  | "piece-length"
  | "proxy-method"
  | "realtime-chunk-checksum"
  | "referer"
  | "remote-time"
  | "remove-control-file"
  | "retry-wait"
  | "reuse-uri"
  | "rpc-save-upload-metadata"
  | "seed-ratio"
  | "seed-time"
  | "select-file"
  | "split"
  | "ssh-host-key-md"
  | "stream-piece-selector"
  | "timeout"
  | "uri-selector"
  | "use-head"
  | "user-agent"
  /* Global Only */
  | "bt-max-open-files"
  | "download-result"
  | "keep-unfinished-download-result"
  | "log"
  | "log-level"
  | "max-concurrent-downloads"
  | "max-download-result"
  | "max-overall-download-limit"
  | "max-overall-upload-limit"
  | "optimize-concurrent-downloads"
  | "save-cookies"
  | "save-session"
  | "server-stat-of";

/**
 * The Input Option
 */
export type TAria2ClientInputOption = {
  [index in TAria2ClientInputOptionNames]?:
    | boolean
    | string
    | number
    | bigint
    | undefined;
};

export type TAria2ClientGID = string;

export type TAria2ClientNotificationNames =
  | "aria2.onDownloadStart"
  | "aria2.onDownloadPause"
  | "aria2.onDownloadStop"
  | "aria2.onDownloadComplete"
  | "aria2.onDownloadError"
  | "aria2.onBtDownloadComplete";
