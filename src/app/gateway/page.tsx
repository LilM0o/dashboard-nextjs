"use client";

import { useRef } from "react";

const GATEWAY_TOKEN = "67c795230cea5b0bba22837c14a3f0cd2c5495371716a096";

export default function GatewayPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const GATEWAY_URL = "https://vps-00207a07.tail419293.ts.net/#token=" + GATEWAY_TOKEN;

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        src={GATEWAY_URL}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Gateway"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
