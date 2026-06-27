import { existsSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const EXTENSIONS = ["webp", "png", "jpg"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const index = searchParams.get("index") ?? "1";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  for (const ext of EXTENSIONS) {
    const filePath = path.join(process.cwd(), "public", "cars", id, `${index}.${ext}`);
    if (existsSync(filePath)) {
      return NextResponse.json({ url: `/cars/${id}/${index}.${ext}` });
    }
  }

  return NextResponse.json({ url: null });
}
