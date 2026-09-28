"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** The current token, read straight from the widget at submit time. */
  getToken: () => string | undefined;
  /** Tokens are single-use: reset after every submit attempt. */
  reset: () => void;
}

/**
 * Cloudflare Turnstile for guest submits (D-03), "interaction-only": invisible for most people,
 * shows a checkbox only when Cloudflare is unsure. Never blocks rendering of the form.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  handleRef,
}: {
  siteKey: string;
  onToken: (token: string | undefined) => void;
  handleRef?: React.RefObject<TurnstileHandle | null>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          "refresh-expired": "auto",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(undefined),
          "error-callback": () => onTokenRef.current(undefined),
        });
        if (handleRef) {
          handleRef.current = {
            getToken: () =>
              (widgetId ? window.turnstile?.getResponse(widgetId) : undefined) || undefined,
            reset: () => {
              onTokenRef.current(undefined);
              if (widgetId) window.turnstile?.reset(widgetId);
            },
          };
        }
      })
      .catch(() => onTokenRef.current(undefined));
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, handleRef]);

  return <div ref={container} className="empty:hidden" />;
}
