import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "http://127.0.0.1:18789";
const GATEWAY_TOKEN = "67c795230cea5b0bba22837c14a3f0cd2c5495371716a096";

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const targetPath = url.searchParams.get("path") || "/";

    const targetUrl = new URL(targetPath, GATEWAY_URL);

    // Clone headers
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${GATEWAY_TOKEN}`);

    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" ? await request.text() : undefined,
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/html",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to proxy to Gateway", details: error.message },
      { status: 500 }
    );
  }
}
