import {
    boolean,
    literal,
    number,
    object,
    string,
    union,
    type Output,
} from "valibot";

export const PluginPropsSchema = object({
    port: number(),
    scroll_debounce_ms: number(),
    disable_sync_scroll: boolean(),
    sync_scroll_type: union([
        literal("middle"),
        literal("top"),
        literal("relative"),
    ]),
    filepath: string(),
});

export type PluginProps = Output<typeof PluginPropsSchema>;

export type NeovimNotificationArg = {
    id: number;
    match: string;
    buf: number;
    file: string;
    event: string;
};

export type CursorMove = {
    cursorLine: number;
    markdownLen: number;
    winHeight: number;
    winLine: number;
    sync_scroll_type: "middle" | "top" | "relative";
};

export type Entry = {
    relativeToRoot: string;
    type: "file" | "dir";
};

export type WsServerMessage = {
    repoName?: string;
    markdown?: string;
    cursorMove?: CursorMove;
    goodbye?: true;
    entries?: Entry[];
    entry: Entry;
    root: string;
};

export type WsClientMessage = {
    entry?: Entry;
};
