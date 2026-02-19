import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IDEAS_FILE = "/home/ubuntu/clawd/workspace/dashboard-ideas.json";

export async function GET() {
  try {
    const data = fs.readFileSync(IDEAS_FILE, "utf-8");
    const ideas = JSON.parse(data);
    return NextResponse.json(ideas);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newIdea = await request.json();

    const data = fs.readFileSync(IDEAS_FILE, "utf-8");
    const ideas = JSON.parse(data);

    const idea = {
      ...newIdea,
      id: String(ideas.ideas.length + 1),
      createdAt: new Date().toISOString(),
    };

    ideas.ideas.push(idea);

    fs.writeFileSync(IDEAS_FILE, JSON.stringify(ideas, null, 2));

    return NextResponse.json(idea);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add idea" },
      { status: 500 }
    );
  }
}
