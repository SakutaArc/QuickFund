import { NextResponse } from "next/server";
import db from "../../db";

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await paramsPromise; // Resolve the promise
  console.log("Project ID for query:", projectId);

  try {
    const [project] = await db.query(
      `
      
    SELECT 
      project_id AS id,
      title,
      goal_amt AS goal,
      raised_amt AS amountRaised,
      start_date,
      end_date,
      FAQ AS faq
    FROM Project 
    WHERE project_id = ?;
    `,

      [projectId]
    );

    console.log("Fetched project:", project);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Error fetching project details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await paramsPromise; // Resolve the promise
  console.log("Received PUT request for project ID:", projectId);

  try {
    // Parse the incoming JSON body
    const body = await request.json();
    console.log("Parsed request body:", body);

    const { title, faq, goal, raised, start_date, end_date } = body;

    // Validate required fields
    if (!title || !faq || goal === undefined || !start_date || !end_date) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Update the project in the database
    const [result] = await db.query(
      `
      UPDATE Project
      SET 
        title = ?, 
        faq = ?, 
        goal_amt = ?, 
        raised_amt = ?, 
        start_date = ?, 
        end_date = ?
      WHERE project_id = ?;
      `,
      [title, faq, goal, raised, start_date, end_date, projectId]
    );

    console.log("Database update result:", result);

    if (result.affectedRows === 0) {
      console.log(
        "No changes detected or update failed for project ID:",
        projectId
      );
      return NextResponse.json(
        { error: "Failed to update project or no changes detected." },
        { status: 400 }
      );
    }

    console.log("Project updated successfully for project ID:", projectId);
    return NextResponse.json({ message: "Project updated successfully." });
  } catch (error) {
    console.error("Error updating project details:", error);
    return NextResponse.json(
      { error: "Error updating project details." },
      { status: 500 }
    );
  }
}
