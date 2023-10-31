import { type Server } from "bun";
import { type Nvim } from "bunvim";
import opener from "opener";
import { type BrowserState, type CustomEvents } from "../types.ts";
import { httpHandler } from "./http.tsx";
import { websocketHandler } from "./websocket.ts";

export function startServer(
    host: string,
    port: number,
    browserState: BrowserState,
    nvim: Nvim<CustomEvents>,
): Server {
    const server = Bun.serve({
        port: port,
        fetch: httpHandler(host, port, browserState.root, nvim),
        websocket: websocketHandler(nvim, browserState),
    });

    opener(`http://${host}:${port}`);
    return server;
}
