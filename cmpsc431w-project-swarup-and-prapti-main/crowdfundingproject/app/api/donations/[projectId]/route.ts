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
      "Fetching donations for project ID:",
      projectId,
      "by user ID:",
      userId
    );

    // Fetch donations for the specified project
    const donationsPromise = db.query(
      `
      SELECT 
        Donation.donation_amt,
        Donation.payment_mthd, 
        User.user_id
      FROM Donation
      INNER JOIN User ON Donation.user_id = User.user_id
      WHERE Donation.project_id = ?
      ORDER BY Donation.donation_amt DESC;
      `,
      [projectId]
    );

    const [donations] = await donationsPromise;

    console.log("Fetched donations:", donations);

    // Return donations or an empty array if none are found
    return NextResponse.json(donations || [], { status: 200 });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Error fetching donations" },
      { status: 500 }
    );
  }
}
