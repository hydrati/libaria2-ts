import type WebSocket from "ws";
import type EventEmitter from "events";
import path from "path";

export abstract class Aria2ClientBaseClass<T> {
  constructor(options: IAria2ClientOptions & T) {}
  public abstract events: EventEmitter;
  public abstract get system(): IAria2ClientSystem;
  public abstract getVersion(): Promise<IAria2Version>;
  public abstract shutdown(): Promise<TAria2ShutdownResult>;
  public abstract forceShutdown(): Promise<TAria2ShutdownResult>;
  public abstract saveSession(): Promise<TAria2SaveSessionResult>;
  public abstract getSessionInfo(): Promise<IAria2ClientSessionInfo>;
  public abstract addUri(
    uris: string[] | string,
    options?: TAria2ClientInputOption,
    position?: number
  ): Promise<TAria2ClientGID>;
  public abstract addTorrent(
    torrent: Buffer | string,
    uris?: string[] | string,
    options?: IAria2ClientOptions,
    position?: number
  ): Promise<TAria2ClientGID>;
  public abstract addMetalink(
    metalink: Buffer | string,
    options?: IAria2ClientOptions,
    position?: number
  ): Promise<TAria2ClientGID[]>;
  public abstract remove(gid: TAria2ClientGID): Promise<TAria2ClientGID>;
  public abstract forceRemove(gid: TAria2ClientGID): Promise<TAria2ClientGID>;
  public abstract pause(gid: TAria2ClientGID): Promise<TAria2ClientGID>;
  public abstract forcePause(gid: TAria2ClientGID): Promise<TAria2ClientGID>;
  public abstract pauseAll(): Promise<TAria2PauseAllResult>;
  public abstract forcePauseAll(): Promise<TAria2PauseAllResult>;
  public abstract unpause(gid: TAria2ClientGID): Promise<TAria2ClientGID>;
  public abstract unpauseAll(): Promise<TAria2PauseAllResult>;
  public abstract tellStatus(
    gid: TAria2ClientGID
  ): Promise<IAria2DownloadStatus>;
  public abstract tellStatus<T extends keyof IAria2DownloadStatus>(
    gid: TAria2ClientGID,
    keys: T[]
  ): Promise<Pick<IAria2DownloadStatus, T>>;
  public abstract getUris(gid: TAria2ClientGID): Promise<IAria2UriStatus[]>;
  public abstract getFiles(gid: TAria2ClientGID): Promise<IAria2FileStatus[]>;
  public abstract getPeers(gid: TAria2ClientGID): Promise<IAria2PeersInfo[]>;
  public abstract getServers(gid: TAria2ClientGID): Promise<TAria2ServersInfo>;
  public abstract tellActive(): Promise<IAria2DownloadStatus[]>;
  public abstract tellActive<T extends keyof IAria2DownloadStatus>(
    keys: T[]
  ): Promise<Pick<IAria2DownloadStatus, T>[]>;
  public abstract tellWaiting(
    offset: number,
    num: number
  ): Promise<IAria2DownloadStatus[]>;
  public abstract tellWaiting<T extends keyof IAria2DownloadStatus>(
    offset: number,
    num: number,
    keys: T[]
  ): Promise<Pick<IAria2DownloadStatus, T>[]>;
  public abstract tellStopped(
    offset: number,
    num: number
  ): Promise<IAria2DownloadStatus[]>;
  public abstract tellStopped<T extends keyof IAria2DownloadStatus>(
    offset: number,
    num: number,
    keys: T[]
  ): Promise<Pick<IAria2DownloadStatus, T>[]>;
  public abstract changePosition(
    gid: TAria2ClientGID,
    pos: number,
    how: EAria2ChangePositionHow
  ): Promise<TAria2ChangePositionResult>;
  public abstract changeUri(
    gid: TAria2ClientGID,
    fileIndex: TAria2DownloadFileIndex,
    delUris: string[],
    addUris: string[],
    position?: number
  ): Promise<TAria2ChangeUriResult>;
  public abstract getOption(
    gid: TAria2ClientGID
  ): Promise<TAria2ClientInputOption>;
  public abstract changeOption(
    gid: TAria2ClientGID,
    options: TAria2ClientInputOption
  ): Promise<TAria2ChangeOptionResult>;
  public abstract getGlobalOption(): Promise<TAria2ClientInputOption>;
  public abstract changeGlobalOption(
    options: TAria2ClientInputOption
  ): Promise<TAria2ChangeOptionResult>;
  public abstract getGlobalStat(): Promise<IAria2GlobalStat>;
  public abstract purgeDownloadResult(): Promise<TAria2PurgeDownloadResult>;
  public abstract removeDownloadResult(
    gid: TAria2ClientGID
  ): Promise<TAria2RemoveDownloadResult>;
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
  enableFeatures: string[];
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

export interface IAria2ClientSystem {
  multicall(
    ...items: IAria2ClientMulticallItem[]
  ): Promise<TAria2ClientMulticallResult>;
  listMethods(): Promise<TAria2ClientMethodList>;
  listNotifications(): Promise<TAria2ClientNotificationList>;
}

export type TAria2ClientMethodList = string[];

export type TAria2ClientNotificationList = string[];

export type TAria2ClientMulticallResult = Array<Promise<object>>;

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
export type TAria2ClientInputOption = {
  [index in TAria2ClientInputOptionNames]?:
    | boolean
    | string
    | number
    | bigint
    | undefined;
};

export type TAria2ClientGID = string;
