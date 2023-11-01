import { createContext } from "react";
import { type WsServerMessage } from "../../../types.ts";

export type MessageHandler = (message: WsServerMessage) => void | Promise<void>;

export const websocketContext = createContext<{
    isConnected: boolean;
    registerHandler: (id: string, cb: MessageHandler) => void;
    currentPath: string | undefined;
    getEntries: (path: string) => void;
    navigate: (path: string) => void;
    repoName: string;
    isSingleFile: boolean;
}>({
    isConnected: false,
    registerHandler: () => null,
    currentPath: undefined,
    getEntries: () => null,
    navigate: () => null,
    repoName: "",
    isSingleFile: false,
});
