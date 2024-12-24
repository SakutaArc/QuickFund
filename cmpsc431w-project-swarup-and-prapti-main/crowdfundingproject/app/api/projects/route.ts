import { NextRequest, NextResponse } from "next/server";
import db from "../db";

// Define types for database row and API response
interface ProjectRow {
  project_id: number;
  title: string;
  goal_amt: number;
  raised_amt: number;
  start_date: string; // Or `Date` if parsed
  end_date: string;   // Or `Date` if parsed
  status: string;
  manager_id: number;
  FAQ: string | null;
}

interface Project {
  projectID: number;
  title: string;
  goalAmt: number;
  raisedAmt: number;
  startDate: string; // Or `Date` if parsed
  endDate: string;   // Or `Date` if parsed
  status: string;
  managerID: number;
  FAQ: string | null;
}

export async function GET(req: NextRequest) {
  try {
    // Fetch data from the database
    const [rows] = await db.query(
      'SELECT project_id, title, goal_amt, raised_amt, start_date, end_date, status, manager_id, FAQ FROM project ORDER BY (raised_amt / goal_amt) DESC LIMIT 5'
    );

    // Map database rows to API response structure
    const projects = (rows as ProjectRow[]).map((row): Project => ({
      projectID: row.project_id,
      title: row.title,
      goalAmt: row.goal_amt,
      raisedAmt: row.raised_amt,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      managerID: row.manager_id,
      FAQ: row.FAQ,
    }));

    // Return the mapped projects as JSON
    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error("Error Fetching Projects", error);

    // Return a user-friendly error message
    return NextResponse.json(
      { message: "An error occurred while fetching projects. Please try again later." },
      { status: 500 }
    );
  }
}
