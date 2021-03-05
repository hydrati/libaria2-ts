export default class When {
  /** @ignore */
  protected $eventHandler = new Map<string, Function[]>();
  public addEventListener<T extends Function>(event: string, listener: T) {
    let h: Function[] | undefined;
    if (this.$eventHandler.has(event)) {
      h = this.$eventHandler.get(event);
      if (!(h instanceof Array)) {
        h = [];
        this.$eventHandler.set(event, h);
      }
    } else {
      h = [];
      this.$eventHandler.set(event, h);
    }
    h.push(listener);
    this.$eventHandler.set(event, h);
  }
  /** @ignore */
  protected emitEvent<R, T, C>(
    event: string,
    thisArg?: R,
    ...args: T[]
  ): C[] | void {
    if (this.$eventHandler.has(event)) {
      let h = this.$eventHandler.get(event);
      let f: Function | undefined = h?.pop();
      let r: C[] = [];
      while (f != undefined) {
        r.push(f?.apply(thisArg, args));
        f = h?.pop();
      }
      return r.reverse();
    }
  }
  /** @ignore */
  protected removeEvent<T extends Function>(event: string): boolean {
    this.$eventHandler.set(event, []);
    return true;
  }
  public removeEventListener<T extends Function>(
    event: string,
    listener: T
  ): boolean {
    let h: Function[] | undefined;
    if (this.$eventHandler.has(event)) {
      h = this.$eventHandler.get(event);
      if (!(h instanceof Array)) {
        return false;
      } else if (h instanceof Array) {
        this.$eventHandler.set(
          event,
          h.filter((v) => v != listener)
        );
        return true;
      }
    }
    return false;
  }
  public when<T>(event: string): Promise<T> {
    return new Promise<T>((r) => this.addEventListener(event, r));
  }
  /** @ignore */
  protected get emit() {
    return this.emitEvent;
  }
}
