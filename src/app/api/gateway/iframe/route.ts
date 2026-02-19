import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "http://127.0.0.1:18789";
const GATEWAY_TOKEN = "67c795230cea5b0bba22837c14a3f0cd2c5495371716a096";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(GATEWAY_URL, {
      headers: {
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Gateway responded with ${response.status}`);
    }

    const html = await response.text();

    // Rewrite relative URLs to point to the proxy
    const rewrittenHtml = html
      .replace(/\.\//g, "/api/gateway/assets/")
      .replace(/href="\.\/favicon/g, 'href="/api/gateway/assets/favicon')
      .replace(/src="\.\/assets/g, 'src="/api/gateway/assets');

    return new NextResponse(rewrittenHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to proxy Gateway", details: error.message },
      { status: 500 }
    );
  }
}
