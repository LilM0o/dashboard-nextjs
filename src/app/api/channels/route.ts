import { NextResponse } from "next/server";

export async function GET() {
  // Mock channels data
  return NextResponse.json({
    channels: [
      { id: "1473390857167044911", name: "#notifs", type: "text", status: "connected" },
      { id: "1468974762100396128", name: "#général", type: "text", status: "connected" },
      { id: "1473847596257644729", name: "#2", type: "text", status: "connected" },
      { id: "1473837398134624266", name: "#projets", type: "text", status: "connected" },
      { id: "1473837440228917399", name: "#dev", type: "text", status: "connected" }
    ],
    total: 5
  });
}
