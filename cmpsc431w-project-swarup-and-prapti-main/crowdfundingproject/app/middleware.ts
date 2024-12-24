import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || 'a7565f36cfe5b02bf093709a976b87cc6a94e1dd3cb4af1076dbe0788281df2ab513ea860fe8bd06138ff3bd7fd55d617a09a7c22b91b85eeeeade4bb5894436'; // Securely manage this key in a .env file
export async function middleware(req: NextRequest) {
  // Check if the path matches the protected routes
  const protectedRoutes = ["/profile"];
  const currentPath = req.nextUrl.pathname;

  if (protectedRoutes.some((route) => currentPath.startsWith(route))) {
    // Extract the token from the Authorization header
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // Redirect to login if token is missing
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    try {
      // Verify the JWT token
      jwt.verify(token, SECRET_KEY);
      // Proceed to the requested route if valid
      return NextResponse.next();
    } catch (err) {
      console.error("Invalid Token:", err);
      // Redirect to login if token is invalid
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  // Allow requests to other routes
  return NextResponse.next();
}
