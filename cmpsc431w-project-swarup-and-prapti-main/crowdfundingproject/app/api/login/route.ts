import { NextRequest, NextResponse } from "next/server";
import db from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY;

export async function POST(req: NextRequest) {
  console.log("Received login request:", req);

  try {
    const body = await req.json();
    console.log("Parsed request body:", body);

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Missing username or password in request" },
        { status: 400 }
      );
    }

    const [users]: any = await db.query(
      "SELECT * FROM User WHERE username = ?",
      [username]
    );
    if (users.length === 0) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      SECRET_KEY!,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      { message: "Login successful!", token },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { message: "Error during login.", error: error.message },
      { status: 500 }
    );
  }
}
