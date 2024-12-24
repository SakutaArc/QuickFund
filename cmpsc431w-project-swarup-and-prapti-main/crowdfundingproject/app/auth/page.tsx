"use client";

import { useState } from "react";
import { useUser } from "../components/userContext";
import { useRouter } from "next/navigation";
export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState(""); // Updated from email to username
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { setToken } = useUser(); // Access context for token management
  const router = useRouter();
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("handleAuth triggered");

    // Basic input validation
    if (!username) {
      setError("Please enter a valid username.");
      console.log("Validation error: Missing username");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      console.log("Validation error: Passwords do not match");
      return;
    }

    try {
      const endpoint = isSignUp ? "/api/signup" : "/api/login";
      console.log(`Sending request to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Response from API:", data);

      if (response.ok) {
        console.log("Request successful");
        if (!isSignUp) {
          setToken(data.token);
          console.log("Token set, navigating to home", data.token);

          router.push("/");
        } else {
          alert("Sign up successful! Please log in.");
          console.log("Sign up successful, switching to login mode");
          setIsSignUp(false);
        }
      } else {
        console.log("Request failed", data.message);
      }
    } catch (err) {
      console.error("Error during authentication", err);
      setError("An error occurred. Please try again.");
    } finally {
      console.log("handleAuth completed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleAuth}
        className="bg-white p-8 rounded shadow-md max-w-md w-full"
      >
        <h2 className="text-xl font-bold mb-4 text-black">
          {isSignUp ? "Sign Up" : "Login"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username} // Updated to username
          onChange={(e) => setUsername(e.target.value)} // Updated to setUsername
          className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
        />

        {isSignUp && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600"
        >
          {isSignUp ? "Sign Up" : "Login"}
        </button>

        <p className="text-sm text-center text-gray-600">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={toggleAuthMode}
            className="text-blue-500 hover:underline font-medium"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>
      </form>
    </div>
  );
}
