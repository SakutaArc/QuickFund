import { NextRequest, NextResponse } from "next/server";
import db from "../db";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export async function POST(req: NextRequest) {
  console.log("Received POST request:", req);

  try {
    // Extract and verify the token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("Missing token");
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
      console.log("Decoded token:", decoded);
    } catch (error) {
      console.log("Invalid token:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      console.log("Missing user ID in token");
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Parse request body
    const { projectId, content } = await req.json();
    if (!projectId || !content) {
      console.log("Missing project ID or content");
      return NextResponse.json(
        { error: "Project ID and content are required" },
        { status: 400 }
      );
    }

    // Insert the comment into the Comment table
    const result = await db.query(
      `
      INSERT INTO Comment (project_id, user_id, content, date_posted)
      VALUES (?, ?, ?, CURRENT_DATE);
      `,
      [projectId, userId, content]
    );

    console.log("Comment added:", result);
    return NextResponse.json(
      { message: "Comment added successfully!", commentId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Error adding comment" },
      { status: 500 }
    );
  }
}
