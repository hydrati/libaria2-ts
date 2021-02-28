import { WebSocketClient as Aria2 } from "libaria2-ts";

(async () => {
  const aria2 = new Aria2({
    protocol: "ws",
    host: "localhost",
    port: 6800,
    path: "/jsonrpc",
  });

  try {
    let r = await aria2.addUri(
      "http://localhost:8800/test.zip",
      {
        header: "",
      },
      0
    );
    console.log(r);
    console.log(await aria2.getGlobalStat());
    console.log((await aria2.tellActive())[0].downloadSpeed);
    console.log(await aria2.getUris(r));
    await aria2.closeConnection();
  } catch (e) {
    console.error(e);
  }
  return;
})();
