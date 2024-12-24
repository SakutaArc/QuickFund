import { NextRequest, NextResponse } from "next/server";
import db from "../db";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    // Extract token and decode
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    console.log("Token:", token);

    if (!token) {
      console.log("Token missing");
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
    console.log("User ID:", userId);

    if (!userId) {
      console.log("Invalid token payload");
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Parse request body
    const { projectId, donationAmt, paymentMethod } = await req.json();
    const parsedProjectId = parseInt(projectId, 10);

    console.log("Parsed request body:", {
      projectId,
      parsedProjectId,
      donationAmt,
      paymentMethod,
    });

    if (!parsedProjectId || !donationAmt || !paymentMethod) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isNaN(donationAmt) || donationAmt <= 0) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    // Ensure user exists in `User` table
    const [userExists] = await db.query(
      "SELECT * FROM User WHERE user_id = ?",
      [userId]
    );

    if (!userExists || userExists.length === 0) {
      console.log("User not found in User table");
      return NextResponse.json(
        { error: "User not found in User table" },
        { status: 404 }
      );
    }

    // Ensure user exists in `GeneralUser` table
    const [generalUserExists] = await db.query(
      "SELECT * FROM GeneralUser WHERE user_id = ?",
      [userId]
    );

    if (!generalUserExists || generalUserExists.length === 0) {
      console.log("Adding user to GeneralUser table");
      await db.query(
        `
        INSERT INTO GeneralUser (user_id)
        VALUES (?);
        `,
        [userId]
      );
    }

    // Check if project exists
    const [projectExists] = await db.query(
      "SELECT * FROM Project WHERE project_id = ?",
      [parsedProjectId]
    );
    if (!projectExists || projectExists.length === 0) {
      console.log("Project not found in database");
      return NextResponse.json(
        { error: "Project not found in database" },
        { status: 404 }
      );
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Insert donation
      console.log("Inserting donation...");
      await db.query(
        `
        INSERT INTO Donation (user_id, project_id, donation_amt, payment_mthd)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          donation_amt = donation_amt + VALUES(donation_amt),
          payment_mthd = VALUES(payment_mthd);
        `,
        [userId, parsedProjectId, donationAmt, paymentMethod]
      );

      // Update project raised amount
      console.log("Updating project raised amount...");
      await db.query(
        `
        UPDATE Project
        SET raised_amt = raised_amt + ?
        WHERE project_id = ?;
        `,
        [donationAmt, parsedProjectId]
      );

      // Commit transaction
      console.log("Committing transaction...");
      await db.query("COMMIT");
    } catch (error) {
      console.error("Error processing donation:", error);
      await db.query("ROLLBACK");
      throw error; // Rethrow the error to handle it below
    }

    return NextResponse.json(
      { message: "Donation successful!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.json(
      { error: "Error processing donation" },
      { status: 500 }
    );
  }
}
