import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULTS = {
  id: "singleton",
  brightness: 1.0,
  audioEnabled: true,
  masterVolume: 0.8,
  sfxVolume: 0.9,
  mouseSensitivity: 1.0,
};

export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await db.settings.create({ data: DEFAULTS });
    }
    return NextResponse.json({ settings });
  } catch (e) {
    return NextResponse.json({ settings: DEFAULTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = {
      brightness: typeof body.brightness === "number" ? body.brightness : 1.0,
      audioEnabled: typeof body.audioEnabled === "boolean" ? body.audioEnabled : true,
      masterVolume: typeof body.masterVolume === "number" ? body.masterVolume : 0.8,
      sfxVolume: typeof body.sfxVolume === "number" ? body.sfxVolume : 0.9,
      mouseSensitivity: typeof body.mouseSensitivity === "number" ? body.mouseSensitivity : 1.0,
    };
    const settings = await db.settings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ error: "db-error" }, { status: 500 });
  }
}
