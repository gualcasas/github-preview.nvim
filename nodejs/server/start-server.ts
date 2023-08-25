import { debounce } from "lodash-es";
import { type NeovimClient } from "neovim";
import { type AsyncBuffer } from "neovim/lib/api/Buffer";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import opener from "opener";
import handler from "serve-handler";
import { WebSocketServer, type WebSocket } from "ws";
import {
    type NeovimNotificationArgs,
    type PluginProps,
    type ServerMessage,
} from "../types";
import { getBufferContent, getCursorMove, wsSend } from "./utils";

const RPC_EVENTS = [
    "markdown-preview-text-changed",
    "markdown-preview-cursor-moved",
    "markdown-preview-buffer-delete",
] as const;

export async function startServer(nvim: NeovimClient, props: PluginProps) {
    await nvim.lua('print("starting MarkdownPreview server")');

    const server = createServer((req, res) => {
        if (req.method === "POST") {
            res.writeHead(200).end();
            server.close();
        }
        return handler(req, res, {
            public: fileURLToPath(dirname(import.meta.url)),
            headers: [
                {
                    source: "**/*",
                    headers: [
                        {
                            key: "Cache-Control",
                            value: "no-cache",
                        },
                    ],
                },
            ],
        });
    });
    const wss = new WebSocketServer({ server });

    const buffers = (await nvim.buffers) as AsyncBuffer[];
    const buffer = buffers.find(async (b) => (await b).id === props.buffer_id)!;

    for (const event of RPC_EVENTS) {
        await nvim.subscribe(event);
    }

    const debouncedWsSend = debounce(
        (ws: WebSocket, message: ServerMessage) => wsSend(ws, message),
        props.scroll_debounce_ms,
        { leading: false, trailing: true },
    );

    wss.on("connection", async (ws, _req) => {
        const markdown = await getBufferContent(buffer);
        const cursorMove = await getCursorMove(nvim, buffer, props);
        wsSend(ws, { markdown, cursorMove });

        nvim.on(
            "notification",
            async (
                event: (typeof RPC_EVENTS)[number],
                [_arg]: NeovimNotificationArgs,
            ) => {
                if (event === "markdown-preview-text-changed") {
                    const markdown = await getBufferContent(buffer);
                    wsSend(ws, { markdown });
                }

                if (event === "markdown-preview-buffer-delete") {
                    wsSend(ws, { goodbye: true });
                    server.close();
                }

                if (event === "markdown-preview-cursor-moved") {
                    const cursorMove = await getCursorMove(nvim, buffer, props);
                    debouncedWsSend(ws, { cursorMove });
                }
            },
        );
    });

    opener(`http://localhost:${props.port}`);
    server.listen(props.port);
}
