import { WebSocketClient as Aria2 } from "libaria2-ts";

(async () => {
  const aria2 = new Aria2({
    protocol: "ws",
    host: "localhost",
    port: 6800,
    path: "/jsonrpc",
  });

  try {
    await aria2.addUri(
      "http://localhost:8800/test.zip",
      {
        header: "",
      },
      0
    );
    await aria2.getGlobalStat();
    await aria2.closeConnection();
  } catch (e) {
    console.error(e);
  }
  return;
})();
