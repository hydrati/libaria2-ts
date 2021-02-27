export namespace Base64 {
  export function atob(val: string): string {
    return Buffer.from(val, 'base64').toString();
  }
  export function btoa(val: string): string {
    return Buffer.from(val).toString('base64');
  }
}