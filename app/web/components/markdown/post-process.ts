import { type MutableRefObject } from "react";
import { type RefObject, type WebsocketContext } from "../websocket-provider/context";

export function postProcessHrefs({
    wsRequest,
    markdownElement,
    refObject,
    single_file,
    currentPath,
}: {
    wsRequest: WebsocketContext["wsRequest"];
    markdownElement: HTMLElement;
    refObject: MutableRefObject<RefObject>;
    single_file: boolean | undefined;
    currentPath: string;
}) {
    const base = window.location.origin + "/";
    // we use currentPath instead of reading window url,
    // because window url is updated after render in a useEffect
    // which happens after this. we use currentPath to get latest value
    const url = base + currentPath;

    // override relative links to trigger wsRequest
    markdownElement.querySelectorAll("a").forEach((element) => {
        const isAbsolute = !element.href.startsWith(base);
        const isAnchor = element.href.slice(url.length).startsWith("#");

        if (isAbsolute || isAnchor) {
            if (isAbsolute) {
                element.target = "_blank";
                element.rel = "noreferrer noopener";
            }
            return;
        }

        if (single_file) {
            element.style.setProperty("color", "purple");
            element.style.setProperty("cursor", "not-allowed");
        }

        // override onClick on relative links
        element.addEventListener("click", (event) => {
            event.preventDefault();
            // if single file, cancel default behaviour and do nothing
            if (single_file) return;

            const pathname = element.href.slice(base.length);
            wsRequest({ type: "get_entry", path: pathname });
        });
    });

    // intercept clicks to <details> tags to set a flag to disable scrolling.
    // it's annoying when you open/close a <details> tag and there's an auto scroll
    markdownElement.querySelectorAll("details").forEach((element) => {
        element.addEventListener(
            "click",
            () => {
                refObject.current.skipScroll = true;
            },
            {
                capture: true,
            },
        );
    });
}

export function updateElementsStyles({
    lines,
    fileExt,
    markdownElement,
    cursorLineElement,
    lineNumbersElement,
}: {
    lines: string[];
    fileExt: string | undefined;
    markdownElement: HTMLElement;
    cursorLineElement: HTMLElement;
    lineNumbersElement: HTMLElement;
}) {
    if (fileExt === "md") {
        markdownElement.style.setProperty("padding", "44px");
        markdownElement.style.setProperty("max-width", "1012px");
        cursorLineElement.style.removeProperty("transform");
        lineNumbersElement.style.setProperty("display", "none");
    } else {
        // rendering code file
        markdownElement.style.setProperty("padding", "20px 0 0 60px");
        markdownElement.style.removeProperty("max-width");
        // move cursorLineElement up so line of code is vertically centered
        cursorLineElement.style.setProperty("transform", "translateY(-9px)");
        lineNumbersElement.style.setProperty("display", lines.length ? "block" : "none");

        // Change code background color to canvas default when displaying only code
        const codeContainer = markdownElement.getElementsByTagName("pre")[0];
        if (codeContainer) {
            codeContainer.style.setProperty("padding", "0px 16px");
            codeContainer.style.setProperty("background", "var(--color-canvas-default)");
        }
    }
}
