import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "http://127.0.0.1:18789";
const GATEWAY_TOKEN = "67c795230cea5b0bba22837c14a3f0cd2c5495371716a096";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const assetUrl = new URL(pathString, GATEWAY_URL);

    const response = await fetch(assetUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Asset responded with ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to proxy asset", details: error.message },
      { status: 500 }
    );
  }
}
