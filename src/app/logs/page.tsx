"use client";

import { useEffect, useRef } from "react";

export default function LogsPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle any messages from the iframe if needed
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        src="/api/logs/iframe"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Logs"
      />
    </div>
  );
}
