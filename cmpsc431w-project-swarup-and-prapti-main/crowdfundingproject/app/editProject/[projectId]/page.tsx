"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId; // Extract `projectId` dynamically

  // Define state for the project
  const [project, setProject] = useState<{
    project_id: string;
    title: string;
    faq: string;
    goal: number;
    raised: number | null;
    start_date: string;
    end_date: string;
    status: string; // Add status field
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch project details on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project details.");
        }
        const data = await response.json();
        setProject(data); // Populate the form fields with existing project data
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Save updated project data
  const handleSave = async () => {
    if (!project) {
      alert("No project data to save.");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          faq: project.faq,
          goal: project.goal,
          raised: project.raised,
          start_date: project.start_date,
          end_date: project.end_date,
          status: project.status, // Include status in the API request
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project updates.");
      }

      alert("Project updated successfully!");
      router.push("/profile"); // Redirect to the profile page after saving
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Error saving project. Please try again.");
    }
  };

  if (isLoading) {
    return <p className="text-center mt-4">Loading project details...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-4">Error: {error}</p>;
  }

  if (!project) {
    return <p className="text-center mt-4">No project data available.</p>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-100 shadow-md rounded-lg">
      <h1 className="text-4xl font-bold text-center mb-8 text-black">
        Edit Project
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="bg-white p-6 rounded shadow-md"
      >
        {/* Project Title */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Project Title</span>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* FAQ */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">FAQ</span>
          <textarea
            value={project.faq}
            onChange={(e) => setProject({ ...project, faq: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* Goal Amount */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Goal Amount</span>
          <input
            type="number"
            value={project.goal}
            onChange={(e) =>
              setProject({ ...project, goal: Number(e.target.value) })
            }
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* Raised Amount */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Raised Amount</span>
          <input
            type="number"
            value={project.raised}
            onChange={(e) =>
              setProject({ ...project, raised: Number(e.target.value) })
            }
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* Start Date */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Start Date</span>
          <input
            type="date"
            value={project.start_date}
            onChange={(e) =>
              setProject({ ...project, start_date: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* End Date */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">End Date</span>
          <input
            type="date"
            value={project.end_date}
            onChange={(e) =>
              setProject({ ...project, end_date: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded"
          />
        </label>

        {/* Status Field */}
        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Status</span>
          <select
            value={project.status}
            onChange={(e) => setProject({ ...project, status: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Paused</option>
          </select>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
