import {
  TAria2ClientInputOption,
  IAria2DownloadStatus,
  IAria2FileStatus,
  IAria2PeersInfo,
  IAria2ServerInfo,
  IAria2ServersInfoItem,
  IAria2GlobalStat,
} from "./adapter";

export function valueFromBoolean(val: boolean): string {
  return val.toString();
}

export function valueFromBigInt(val: BigInt): string {
  return val.toString();
}

export function valueFromNumber(val: Number): string {
  return val.toString();
}

export function valueToBoolean(val: string): boolean {
  if (/^(false|true)$/.test(val)) {
    if (val == "true") {
      return true;
    } else {
      return false;
    }
  } else {
    throw "Unknown Boolean Value: " + val;
  }
}

export function valueToNumber(val: string): number {
  return Number(val);
}

export function valueToBigInt(val: string): BigInt {
  return BigInt(val);
}

export function fromTAria2ClientInputOption(v: TAria2ClientInputOption): any {
  let o = {};
  for (const k in v) {
    if (v[k] != undefined) {
      if (typeof v[k] == "string") {
        o[k] = v[k];
      } else if (typeof v[k] == "boolean") {
        o[k] = valueFromBoolean(v[k]);
      } else if (typeof v[k] == "number") {
        o[k] = valueFromNumber(v[k]);
      } else if (typeof v[k] == "bigint") {
        o[k] = valueFromBigInt(v[k]);
      } else {
        throw "Unknown Value: " + v[k];
      }
    }
  }
  return o as any;
}

export function intoTAria2ClientInputOption(v: any): TAria2ClientInputOption {
  let o = {};
  for (const k in v) {
    if (v[k] != undefined) {
      if (typeof v[k] == "string") {
        o[k] = v[k];
      } else if (typeof v[k] == "boolean") {
        o[k] = valueToBoolean(v[k]);
      } else if (typeof v[k] == "number") {
        o[k] = valueToNumber(v[k]);
      } else if (typeof v[k] == "bigint") {
        o[k] = valueToBigInt(v[k]);
      } else {
        throw "Unknown Value: " + v[k];
      }
    }
  }
  return o as TAria2ClientInputOption;
}

export function intoIAria2DownloadStatus(v: any): IAria2DownloadStatus {
  let o = Object.assign({}, v) as any;
  if (v.totalLength != undefined) o.totalLength = valueToBigInt(v.totalLength);
  if (v.totalLength != undefined)
    o.completedLength = valueToBigInt(v.completedLength);
  if (v.totalLength != undefined)
    o.uploadLength = valueToBigInt(v.uploadLength);
  if (v.totalLength != undefined)
    o.downloadSpeed = valueToBigInt(v.downloadSpeed);
  if (v.totalLength != undefined) o.uploadSpeed = valueToBigInt(v.uploadSpeed);
  if (v.numSeeders != undefined) {
    o.numSeeders = valueToBigInt(v.numSeeders);
  }
  if (v.seeder != undefined) {
    o.seeder = valueToBoolean(v.seeder);
  }
  if (v.totalLength != undefined) o.pieceLength = valueToBigInt(v.pieceLength);
  if (v.totalLength != undefined) o.numPieces = valueToBigInt(v.numPieces);
  if (v.totalLength != undefined) o.connections = valueToBigInt(v.connections);
  if (v.errorCode != undefined) {
    o.errorCode = valueToNumber(v.errorCode);
  }
  if (v.bittorrent != undefined) {
    if (v.bittorrent.creationDate != undefined) {
      o.bittorrent.creationDate = valueToBigInt(v.bittorrent.creationDate);
    }
  }
  if (v.files != undefined)
    for (const l in v.files as Array<any>) {
      o.files[l] = intoIAria2FileStatus(v.files[l]);
    }
  return o as IAria2DownloadStatus;
}

export function intoIAria2FileStatus(v: any): IAria2FileStatus {
  let o = Object.assign({}, v);
  o.length = valueToBigInt(v.length);
  o.completedLength = valueToBigInt(v.completedLength);
  o.index = valueToNumber(v.index);
  o.selected = valueToBoolean(v.selected);
  return o as IAria2FileStatus;
}

export function intoIAria2PeersInfo(v: any): IAria2PeersInfo {
  let o = Object.assign({}, v) as IAria2PeersInfo;
  o.amChoking = valueToBoolean(v.amChoking);
  o.downloadSpeed = valueToBigInt(v.downloadSpeed);
  o.peerChoking = valueToBoolean(v.peerChoking);
  o.port = valueToNumber(v.port);
  o.seeder = valueToBoolean(v.seeder);
  o.uploadSpeed = valueToBigInt(v.uploadSpeed);
  return o;
}

export function intoIAria2ServerInfo(v: any): IAria2ServerInfo {
  let o = Object.assign({}, v) as IAria2ServerInfo;
  o.downloadSpeed = valueToBigInt(v.downloadSpeed);
  return o;
}

export function intoIAria2ServersInfoItem(v: any): IAria2ServersInfoItem {
  let o = Object.assign({}, v) as IAria2ServersInfoItem;
  o.index = valueToNumber(v.index);
  for (const k in v.servers as Array<any>) {
    o.servers[k] = intoIAria2ServerInfo(v.servers[k]);
  }
  return o;
}

export function intoIAria2GlobalStat(v: any): IAria2GlobalStat {
  let o = Object.assign({}, v) as IAria2GlobalStat;
  o.downloadSpeed = valueToBigInt(v.downloadSpeed);
  o.uploadSpeed = valueToBigInt(v.uploadSpeed);
  o.numActive = valueToNumber(v.numActive);
  o.numWaiting = valueToNumber(v.numWaiting);
  o.numStopped = valueToNumber(v.numStopped);
  o.numStoppedTotal = valueToNumber(v.numStoppedTotal);
  return o;
}
