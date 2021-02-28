import { WebSocketClient as Aria2 } from "libaria2-ts";

const aria2 = new Aria2({
  protocol: "ws",
  host: "localhost",
  port: 6800,
});

await aria2.addUri("http://localhost:8800/test.zip");
