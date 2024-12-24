import { NextRequest, NextResponse } from "next/server";
import db from "../db";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    const result = await db.query("SELECT 1");
    console.log("Database connected successfully", result);
  } catch (err) {
    console.error("Database connection error:", err);
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashedPassword);

    const [result]: any = await db.query(
      "INSERT INTO User (username, password, acct_status) VALUES (?, ?, 'active')",
      [username, hashedPassword]
    );
    console.log("Insert Result:", result);

    return NextResponse.json(
      { message: "User registered successfully!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { message: "Error registering user.", error: error.message },
      { status: 500 }
    );
  }
}
