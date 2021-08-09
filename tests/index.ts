import { WebSocket as Aria2WebSocket } from "../src/lib";

(async () => {
  const client1 = new Aria2WebSocket.Client({
    protocol: "ws",
    host: "localhost",
    port: 6800,
  });

  const gid1 = await client1.addUri(
    "https://sharepoint.latest10.win/19042.804/19042.804.210131-1457.VB_RELEASE_SVC_PROD1_CLIENTMULTI_X64FRE_ZH-CN.ISO"
  );
  console.log("added", gid1);
  client1.onceDownloadStart().then((event) => {
    console.log("dl started,", this, event);
  });
  client1.closeConnection();
})();
