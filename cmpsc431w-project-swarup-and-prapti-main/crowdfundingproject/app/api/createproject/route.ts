import { NextRequest, NextResponse } from "next/server";
import db from "../db";
import jwt, { JwtPayload } from "jsonwebtoken";
const SECRET_KEY = process.env.SECRET_KEY || "your-secure-secret-key";

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token
    console.log(req.headers);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token is missing." },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    console.log(decoded);
    const userId = decoded.userId;
    console.log(userId);

    // Retrieve the user_id from the database using the username
    const connection = await db.getConnection();

    // Verify manager exists
    const [managerCheck]: any = await connection.query(
      `SELECT * FROM ProjectManager WHERE user_id = ?`,
      [userId]
    );

    // Insert manager if not found
    if (managerCheck.length === 0) {
      await connection.query(
        `INSERT INTO ProjectManager (user_id, projects_managed, rating) VALUES (?, 0, NULL)`,
        [userId]
      );
    }

    // Parse the request body
    const body = await req.json();
    const { title, goal, faq, category, startDate, endDate, tags, rewards } =
      body;

    if (!title || !goal || !faq || !startDate || !endDate) {
      return NextResponse.json(
        { message: "All required fields must be filled." },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    try {
      // Insert the project into the Project table
      const [projectResult]: any = await connection.query(
        `
        INSERT INTO Project (title, goal_amt, FAQ, start_date, end_date, status, manager_id)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
        `,
        [title, goal, faq, startDate, endDate, userId]
      );

      const projectId = projectResult.insertId;

      // Insert tags into the ProjectTags table
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          await connection.query(
            `INSERT INTO Tags (tag_value) VALUES (?) ON DUPLICATE KEY UPDATE tag_value = tag_value`,
            [tag]
          );

          const [tagResult]: any = await connection.query(
            `SELECT tag_id FROM Tags WHERE tag_value = ?`,
            [tag]
          );

          await connection.query(
            `INSERT INTO ProjectTags (project_id, tag_id) VALUES (?, ?)`,
            [projectId, tagResult[0].tag_id]
          );
        }
      }

      // Insert rewards into the Reward table
      if (rewards && Array.isArray(rewards)) {
        for (const reward of rewards) {
          await connection.query(
            `INSERT INTO Reward (project_id, description, min_donation) VALUES (?, ?, ?)`,
            [projectId, reward.description, parseFloat(reward.minDonation)]
          );
        }
      }

      await connection.commit();

      return NextResponse.json(
        { message: "Project created successfully!" },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      console.error("Error creating project:", error);
      return NextResponse.json(
        { message: "An error occurred while creating the project." },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
