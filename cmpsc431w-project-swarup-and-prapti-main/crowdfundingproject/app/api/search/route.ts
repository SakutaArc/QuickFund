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
    // Parse the search query and tags from the URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const tags = searchParams.get("tags"); // Tags as a comma-separated string

    if (!query && !tags) {
      return NextResponse.json(
        { message: "At least one search parameter (query or tags) is required." },
        { status: 400 }
      );
    }

    // Base SQL query with optional joins for filtering
    let sql = `
      SELECT DISTINCT p.project_id, p.title, p.goal_amt, p.raised_amt, p.start_date, 
                      p.end_date, p.status, p.manager_id, p.FAQ
      FROM Project p
      LEFT JOIN ProjectTags pt ON p.project_id = pt.project_id
      LEFT JOIN Tags t ON pt.tag_id = t.tag_id
      WHERE 1=1
    `;
    const params: string[] = [];

    // Add title filtering (query parameter)
    if (query) {
      sql += ` AND p.title LIKE ?`;
      params.push(`%${query}%`);
    }

    // Add tag filtering (tags parameter)
    if (tags) {
      const tagList = tags.split(","); // Split the comma-separated string into an array
      sql += ` AND t.tag_value IN (${tagList.map(() => "?").join(",")})`;
      params.push(...tagList);
    }

    // Add ordering
    sql += `
      ORDER BY (p.raised_amt / p.goal_amt) DESC
    `;

    // Execute the query with parameters
    const [rows] = await db.query(sql, params);

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

    // Return the filtered projects as JSON
    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error("Error Fetching Projects", error);

    // Return a user-friendly error message
    return NextResponse.json(
      { message: "An error occurred while searching projects. Please try again later." },
      { status: 500 }
    );
  }
}
