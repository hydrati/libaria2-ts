export namespace Base64 {
  export function atob(val: string): string {
    return Buffer.from(val, "base64").toString();
  }
  export function btoa(val: string): string {
    return Buffer.from(val).toString("base64");
  }
}
export const isNode = () => {
  if (typeof globalThis?.process?.versions?.node == "string") {
    return true;
  } else return false;
};
