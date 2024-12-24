import { NextRequest, NextResponse } from "next/server";
import db from "@/app/api/db"; // Adjust the path to your DB module
import jwt from "jsonwebtoken";

export async function PUT(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded || typeof decoded === "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { userId } = decoded as { userId: number };

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing required fields: username and password." },
        { status: 400 }
      );
    }

    // Update user details in the database
    await db.query("UPDATE User SET username = ?, password = ? WHERE user_id = ?", [
      username,
      password,
      userId,
    ]);

    return NextResponse.json({ message: "User updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error updating user details" }, { status: 500 });
  }
}
