"use client";

import { useEffect, useRef } from "react";

const GATEWAY_TOKEN = "67c795230cea5b0bba22837c14a3f0cd2c5495371716a096";

export default function LogsPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Use direct Gateway URL with token in hash
    // This is how openclaw dashboard command passes the token
    iframe.src = `http://127.0.0.1:18789/logs#token=${GATEWAY_TOKEN}`;

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
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Logs"
      />
    </div>
  );
}
