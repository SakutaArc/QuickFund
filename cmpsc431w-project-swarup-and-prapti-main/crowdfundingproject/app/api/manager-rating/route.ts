import { NextRequest, NextResponse } from "next/server";
import db from "../db";

export async function POST(req: NextRequest) {
  const { projectId, rating } = await req.json();

  try {
    // Start a transaction
    await db.query("START TRANSACTION");

    // Insert the new rating (for simplicity, assuming a ratings table exists)
    await db.query(
      "INSERT INTO Ratings (manager_id, rating) SELECT manager_id, ? FROM Project WHERE project_id = ?",
      [rating, projectId]
    );

    // Recalculate the average rating for the manager
    await db.query(
      `
      UPDATE ProjectManager
      SET rating = (
        SELECT AVG(rating)
        FROM Ratings
        WHERE manager_id = ProjectManager.user_id
      )
      WHERE user_id = (SELECT manager_id FROM Project WHERE project_id = ?)
      `,
      [projectId]
    );

    // Commit the transaction
    await db.query("COMMIT");

    // Fetch updated average rating
    const [updatedRating] = await db.query(
      `
      SELECT rating
      FROM ProjectManager
      WHERE user_id = (SELECT manager_id FROM Project WHERE project_id = ?)
      `,
      [projectId]
    );

    return NextResponse.json({ newAverageRating: updatedRating[0].rating });
  } catch (error) {
    // Rollback the transaction on error
    await db.query("ROLLBACK");
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Error submitting rating" }, { status: 500 });
  }
}
