import { NextRequest, NextResponse } from "next/server";
import db from "../../db";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Resolve the projectId from params
    const { projectId } = await paramsPromise;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Extract and verify token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("Token is missing");
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
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

    // Parse refund amount
    const { refundAmount } = await req.json();
    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid refund amount" },
        { status: 400 }
      );
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Fetch the total donated amount for the user to the project
      const [donations] = await db.query(
        `
        SELECT SUM(donation_amt) as total_donated
        FROM Donation
        WHERE user_id = ? AND project_id = ?;
        `,
        [userId, projectId]
      );

      const totalDonated = donations[0]?.total_donated || 0;
      if (totalDonated < refundAmount) {
        throw new Error(
          `Refund amount exceeds the user's total donations of ${totalDonated}`
        );
      }

      // Reduce the donated amount
      await db.query(
        `
        UPDATE Donation
        SET donation_amt = donation_amt - ?
        WHERE user_id = ? AND project_id = ?;
        `,
        [refundAmount, userId, projectId]
      );

      // Reduce the raised amount in the project
      await db.query(
        `
        UPDATE Project
        SET raised_amt = raised_amt - ?
        WHERE project_id = ?;
        `,
        [refundAmount, projectId]
      );

      // Commit the transaction
      await db.query("COMMIT");

      return NextResponse.json(
        { message: "Refund processed successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error processing refund:", error);
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Error processing refund" },
      { status: 500 }
    );
  }
}
