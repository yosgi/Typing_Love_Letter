import {  NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLAG_PATH = path.join(process.cwd(), "read.flag");

// 处理 GET、POST、DELETE 请求
export async function GET() {
  if (fs.existsSync(FLAG_PATH)) {
    return NextResponse.json({ status: "read", message: "This page has already been read." });
  }
  return NextResponse.json({ status: "unread", message: "This page is available for reading." });
}

export async function POST() {
  fs.writeFileSync(FLAG_PATH, "This page has been read.");
  return NextResponse.json({ status: "read", message: "Page marked as read." });
}

// 可选：用于重置访问权限
export async function DELETE() {
  if (fs.existsSync(FLAG_PATH)) {
    fs.unlinkSync(FLAG_PATH);
  }
  return NextResponse.json({ status: "unread", message: "Page access reset." });
}
