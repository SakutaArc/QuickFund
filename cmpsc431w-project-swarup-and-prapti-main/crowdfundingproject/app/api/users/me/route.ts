import { NextResponse } from "next/server";
import db from "../../db";
import jwt from "jsonwebtoken";
import { type } from "os";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY; // Use a secure secret key in production


export async function GET(req: Request) {
  // Get the Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token
    const decoded: any = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Fetch the user data from the database
    const [userResult] = await db.query(
      `SELECT u.user_id, u.username AS email, pm.projects_managed, pm.rating, gu.total_donations
       FROM User u
       LEFT JOIN ProjectManager pm ON u.user_id = pm.user_id
       LEFT JOIN GeneralUser gu ON u.user_id = gu.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    const user = userResult[0];

    // Fetch donations made by the user
    const [donationsResult] = await db.query(
      `SELECT d.project_id, d.donation_amt AS amount, p.title AS project, d.payment_mthd AS method
       FROM Donation d
       JOIN Project p ON d.project_id = p.project_id
       WHERE d.user_id = ?`,
      [userId]
    );

    // Fetch projects created by the user (if they are a Project Manager)
    const [createdProjectsResult] = await db.query(
      `SELECT p.project_id, p.title, p.goal_amt, p.raised_amt, p.status
       FROM Project p
       WHERE p.manager_id = ?`,
      [userId]
    );

    return NextResponse.json({
      userId: user.user_id,
      name: user.username,
      email: user.email,
      projectsManaged: user.projects_managed,
      rating: user.rating,
      totalDonations: user.total_donations,
      donations: donationsResult,
      createdProjects: createdProjectsResult,
    });
  } catch (error) {
    console.error("Error in /api/users/me:", error);
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
