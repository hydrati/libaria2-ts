import fs from "fs";
import execa from "execa";
import { IAria2SpawnOptions, IAria2RpcOptions } from "./adapter";

export class Aria2Process {
  private $options: IAria2SpawnOptions;
  private $process?: execa.ExecaChildProcess<string>;
  private $args: string[] = [];
  constructor(options: IAria2SpawnOptions) {
    let option = Object.assign({}, options);
    option.addOptions = option.addOptions ?? new Map();
    option.addArgs = option.addArgs ?? [];
    option.rpcOptions = option.rpcOptions ?? {
      rpc: {
        port: 6800,
      },
      auth: {},
      secure: undefined,
      other: {},
    };
    this.$options = option;
  }

  async spawn() {
    if (this.$options.aria2cPath == "") {
      throw "invalid aria2c path";
    }
    if (!fs.existsSync(this.$options.aria2cPath)) {
      throw "not found aria2c at path";
    }
    await this.$createArgs();
    this.$process = execa(this.$options.aria2cPath, [...this.$args], {});
    this.$process.catch(this.$processErrorHandle.bind(this));
    await new Promise((r) => setTimeout(r, 800));
  }

  public get process() {
    return this.$process;
  }

  public get args() {
    return this.$args;
  }

  public get options() {
    return this.$options;
  }

  private async $processErrorHandle(
    reason: execa.ExecaError<string>
  ): Promise<execa.ExecaReturnValue<string>> {
    console.error("Error!");
    console.error(reason.stderr);
    return reason;
  }

  private async $createArgs() {
    let args = ["--enable-rpc=true", `--stop-with-process=${process.pid}`];
    let rpcOptions = (this.$options.rpcOptions as unknown) as any;
    for (const key of Object.keys(rpcOptions)) {
      if (rpcOptions[key] != undefined) {
        for (const ikey of Object.keys(rpcOptions[key])) {
          if (rpcOptions[key][ikey] != undefined) {
            let val = rpcOptions[key][ikey] as any;
            switch (key) {
              case "rpc":
                switch (ikey) {
                  case "port":
                    args.push(`--rpc-listen-port=${val}`);
                    break;
                  case "maxRequestSize":
                    args.push(`--rpc-max-request-size=${val}`);
                    break;
                  case "listenAll":
                    args.push(`--rpc-listen-all=${val}`);
                    break;
                  case "allowOriginAll":
                    args.push(`--rpc-allow-origin-all=${val}`);
                    break;
                }
                break;
              case "auth":
                switch (ikey) {
                  case "user":
                    args.push(`--rpc-user=${val}`);
                    break;
                  case "passwd":
                    args.push(`--rpc-passwd=${val}`);
                    break;
                  case "secret":
                    args.push(`--rpc-secret=${val}`);
                    break;
                }
                break;
              case "secure":
                switch (ikey) {
                  case "certificate":
                    args.push(`--rpc-certificate=${val}`);
                    break;
                  case "privateKey":
                    args.push(`--rpc-private-key=${val}`);
                    break;
                  case "useSecure":
                    args.push(`--rpc-secure=${val}`);
                }
                break;
              case "other":
                switch (ikey) {
                  case "saveUploadMetadata":
                    args.push(`--rpc-save-upload-metadata=${val}`);
                    break;
                  case "pause":
                    args.push(`--pause=${val}`);
                    break;
                  case "pauseMetadata":
                    args.push(`--pause-metadata=${val}`);
                    break;
                }
                break;
            }
          }
        }
      }
    }
    let opt: string[] = [];
    this.$options.addOptions?.forEach((v, k) => {
      opt.push(`--${k}=${v}`);
    });
    args = [...args, ...(this.$options.addArgs ?? []), ...opt];
    this.$args = args;
  }
}
