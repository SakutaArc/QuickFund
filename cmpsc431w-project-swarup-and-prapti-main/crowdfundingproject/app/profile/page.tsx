"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/userContext";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { token, setToken } = useUser(); // Use context for token
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    donations: [],
    createdProjects: [],
  });

  const [editDetails, setEditDetails] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (!token) {
      router.push("/auth"); // Redirect to auth if not logged in
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Send token for authentication
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setEditDetails({ name: data.name, email: data.email });
        } else {
          alert("Failed to load user data.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [token, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditDetails({ ...editDetails, [name]: value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editDetails),
      });

      if (response.ok) {
        setUser({ ...user, ...editDetails });
        setIsEditing(false);
        alert("Profile updated successfully.");
      } else {
        alert("Failed to update details.");
      }
    } catch (error) {
      console.error("Error updating details:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account?")) {
      try {
        const response = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert("Account deleted successfully.");
          setToken(null);
          router.push("/auth");
        } else {
          alert("Failed to delete account.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const handleLogout = () => {
    setToken(null); // Clear token
    router.push("/auth"); // Redirect to auth page
  };

  if (!token) return null; // Prevent rendering if not logged in

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-100 shadow-md rounded-lg">
      <h1 className="text-4xl font-bold text-center mb-8 text-black">
        My Profile
      </h1>

      {/* User Details */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Personal Details
        </h2>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={editDetails.name}
                onChange={handleInputChange}
                className="mt-1 p-2 w-full text-gray-700 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={editDetails.email}
                onChange={handleInputChange}
                className="mt-1 p-2 w-full border text-gray-700 border-gray-300 rounded"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-lg text-gray-600 space-y-2">
            <p>
              <strong className="text-black">Name:</strong> {user.name}
            </p>
            <p>
              <strong className="text-black">Email:</strong> {user.email}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded mt-4"
            >
              Edit Details
            </button>
          </div>
        )}
      </section>

      {/* Donations */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          My Donations
        </h2>
        {user.donations.length > 0 ? (
          <ul className="text-lg text-gray-600 space-y-2">
            {user.donations.map((donation, index) => (
              <li key={index}>
                Donated{" "}
                <strong className="text-black">${donation.amount}</strong> to{" "}
                <strong className="text-black">{donation.project_id}</strong> on{" "}
                {donation.date}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">You have not made any donations yet.</p>
        )}
      </section>

      {/* Created Projects */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          My Created Projects
        </h2>
        {user.createdProjects.length > 0 ? (
          <ul className="text-lg text-gray-600 space-y-4">
            {user.createdProjects.map((project) => (
              <li
                key={project.project_id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <strong className="text-black">{project.title}</strong>{" "}
                  {project.status} (
                  <strong className="text-black">{project.raised_amt}</strong>{" "}
                  raised)
                </div>
                <Link href={`/editProject/${project.project_id}`}>
                  <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                    Edit
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            You have not created any projects yet.
          </p>
        )}
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          <Link href="/createProject">Create Project</Link>
        </button>
      </section>

      {/* Delete Account */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded mt-4"
        >
          Delete Account
        </button>
      </section>

      {/* Logout */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <button
          onClick={handleLogout}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded mt-4"
        >
          Log Out
        </button>
      </section>
    </div>
  );
}
