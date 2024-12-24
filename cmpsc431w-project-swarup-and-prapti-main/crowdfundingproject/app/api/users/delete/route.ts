import { NextRequest, NextResponse } from "next/server";
import db from "../../db"; // Adjust the path to your database connection module
import jwt from "jsonwebtoken";
import { FieldPacket, ResultSetHeader } from 'mysql2';

export async function DELETE(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
  
    try {
      // Verify JWT token to extract user ID
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        throw new Error("JWT_SECRET is not set in environment variables.");
      }
  
      const decoded = jwt.verify(token, secretKey) as { userId: number };
      const userId = decoded.userId;
  
      if (!userId) {
        return NextResponse.json(
          { message: "Unauthorized: Invalid token." },
          { status: 401 }
        );
      }
  
      // Start database transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
  
      try {
        // Delete user from related tables first to maintain referential integrity
        await connection.query("DELETE FROM GeneralUser WHERE user_id = ?", [userId]);
        await connection.query("DELETE FROM ProjectManager WHERE user_id = ?", [userId]);
        await connection.query("DELETE FROM Donation WHERE user_id = ?", [userId]);
        await connection.query("DELETE FROM Comment WHERE user_id = ?", [userId]);
  
        // Finally, delete the user from the User table
        const [result]: [ResultSetHeader, FieldPacket[]] = await connection.query("DELETE FROM User WHERE user_id = ?", [userId]);
        if (result?.affectedRows === 0) {
          throw new Error("User not found or already deleted.");
        }
  
        // Commit the transaction
        await connection.commit();
  
        return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });
      } catch (error) {
        // Rollback the transaction in case of error
        await connection.rollback();
        console.error("Error deleting user:", error);
        return NextResponse.json(
          { message: "Failed to delete user. Please try again later." },
          { status: 500 }
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { message: "Unauthorized: Invalid token." },
        { status: 401 }
      );
    }
  }