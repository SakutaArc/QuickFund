import { NextRequest, NextResponse } from "next/server";
import db from "../../db";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Resolve the params promise to get the project ID
    const { projectId } = await paramsPromise;

    console.log("Project ID:", projectId);
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Extract and verify token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("Token is missing");
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
      console.log("Decoded token:", decoded);
    } catch (error) {
      console.log("Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      console.log("Invalid token payload");
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    console.log(
      "Fetching comments for project ID:",
      projectId,
      "by user ID:",
      userId
    );

    // Fetch comments for the specified project
    const commentsPromise = db.query(
      `
      SELECT 
        Comment.comment_id, 
        Comment.content, 
        Comment.date_posted, 
        User.username 
      FROM Comment
      INNER JOIN User ON Comment.user_id = User.user_id
      WHERE Comment.project_id = ?
      ORDER BY Comment.date_posted DESC;
      `,
      [projectId]
    );

    const [comments] = await commentsPromise;

    console.log("Fetched comments:", comments);

    // Return comments or an empty array if none are found
    return NextResponse.json(comments || [], { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Error fetching comments" },
      { status: 500 }
    );
  }
}
