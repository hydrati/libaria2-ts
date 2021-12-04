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

export function valueFrombigint(val: bigint): string {
  return val.toString();
}

export function valueFromnumber(val: number): string {
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

export function valueTonumber(val: string): number {
  return Number(val);
}

export function valueTobigint(val: string): bigint {
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
        o[k] = valueFromnumber(v[k]);
      } else if (typeof v[k] == "bigint") {
        o[k] = valueFrombigint(v[k]);
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
        o[k] = valueTonumber(v[k]);
      } else if (typeof v[k] == "bigint") {
        o[k] = valueTobigint(v[k]);
      } else {
        throw "Unknown Value: " + v[k];
      }
    }
  }
  return o as TAria2ClientInputOption;
}

export function intoIAria2DownloadStatus(v: any): IAria2DownloadStatus {
  let o = Object.assign({}, v) as any;
  if (v.totalLength != undefined) o.totalLength = valueTobigint(v.totalLength);
  if (v.totalLength != undefined)
    o.completedLength = valueTobigint(v.completedLength);
  if (v.totalLength != undefined)
    o.uploadLength = valueTobigint(v.uploadLength);
  if (v.totalLength != undefined)
    o.downloadSpeed = valueTobigint(v.downloadSpeed);
  if (v.totalLength != undefined) o.uploadSpeed = valueTobigint(v.uploadSpeed);
  if (v.numSeeders != undefined) {
    o.numSeeders = valueTobigint(v.numSeeders);
  }
  if (v.seeder != undefined) {
    o.seeder = valueToBoolean(v.seeder);
  }
  if (v.totalLength != undefined) o.pieceLength = valueTobigint(v.pieceLength);
  if (v.totalLength != undefined) o.numPieces = valueTobigint(v.numPieces);
  if (v.totalLength != undefined) o.connections = valueTobigint(v.connections);
  if (v.errorCode != undefined) {
    o.errorCode = valueTonumber(v.errorCode);
  }
  if (v.bittorrent != undefined) {
    if (v.bittorrent.creationDate != undefined) {
      o.bittorrent.creationDate = valueTobigint(v.bittorrent.creationDate);
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
  o.length = valueTobigint(v.length);
  o.completedLength = valueTobigint(v.completedLength);
  o.index = valueTonumber(v.index);
  o.selected = valueToBoolean(v.selected);
  return o as IAria2FileStatus;
}

export function intoIAria2PeersInfo(v: any): IAria2PeersInfo {
  let o = Object.assign({}, v) as IAria2PeersInfo;
  o.amChoking = valueToBoolean(v.amChoking);
  o.downloadSpeed = valueTobigint(v.downloadSpeed);
  o.peerChoking = valueToBoolean(v.peerChoking);
  o.port = valueTonumber(v.port);
  o.seeder = valueToBoolean(v.seeder);
  o.uploadSpeed = valueTobigint(v.uploadSpeed);
  return o;
}

export function intoIAria2ServerInfo(v: any): IAria2ServerInfo {
  let o = Object.assign({}, v) as IAria2ServerInfo;
  o.downloadSpeed = valueTobigint(v.downloadSpeed);
  return o;
}

export function intoIAria2ServersInfoItem(v: any): IAria2ServersInfoItem {
  let o = Object.assign({}, v) as IAria2ServersInfoItem;
  o.index = valueTonumber(v.index);
  for (const k in v.servers as Array<any>) {
    o.servers[k] = intoIAria2ServerInfo(v.servers[k]);
  }
  return o;
}

export function intoIAria2GlobalStat(v: any): IAria2GlobalStat {
  let o = Object.assign({}, v) as IAria2GlobalStat;
  o.downloadSpeed = valueTobigint(v.downloadSpeed);
  o.uploadSpeed = valueTobigint(v.uploadSpeed);
  o.numActive = valueTonumber(v.numActive);
  o.numWaiting = valueTonumber(v.numWaiting);
  o.numStopped = valueTonumber(v.numStopped);
  o.numStoppedTotal = valueTonumber(v.numStoppedTotal);
  return o;
}
