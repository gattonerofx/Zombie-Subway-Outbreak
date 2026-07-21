import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET leaderboard - top scores
export async function GET() {
  try {
    const scores = await db.score.findMany({
      orderBy: { score: "desc" },
      take: 10,
    });
    return NextResponse.json({ scores });
  } catch (e) {
    return NextResponse.json({ scores: [], error: "db-error" }, { status: 200 });
  }
}

// POST a new score
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, score, wave, kills, weapon } = body;
    if (typeof score !== "number") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const created = await db.score.create({
      data: {
        playerName: (playerName || "Survivor").slice(0, 24),
        score,
        wave: wave ?? 0,
        kills: kills ?? 0,
        weapon: weapon ?? "machinegun",
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return NextResponse.json({ error: "db-error" }, { status: 500 });
  }
}
