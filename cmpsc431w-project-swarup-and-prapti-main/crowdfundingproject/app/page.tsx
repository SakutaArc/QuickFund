"use client";

import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import Link from "next/link";
import ProjectCard from "./components/ProjectCard";
import { useUser } from "./components/userContext";

type Project = {
  projectId: string;
  title: string;
};

export default function Home() {
  const [popularProjects, setPopularProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  const { token, setToken } = useUser(); // Access user context
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxVisible = 4; // Number of visible projects for Popular Projects carousel

  useEffect(() => {
    console.log("Before fetch:", {
      popularProjects,
      setPopularProjects,
      allProjects,
      setAllProjects,
    });
    const fetchProjects = async () => {
      try {
        setLoading(true);

        // Fetch popular projects
        const popularResponse = await fetch("/api/projects");
        const popularData: Project[] = await popularResponse.json();

        // Fetch all projects
        const allResponse = await fetch("/api/allprojects");
        const allData: Project[] = await allResponse.json();

        setPopularProjects(popularData);
        setAllProjects(allData);
        console.log("After fetch:", {
          popularData,
          allData,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Failed to load projects. Error: ${errorMessage}`);
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleLeftClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : popularProjects.length - maxVisible
    );
  };

  const handleRightClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < popularProjects.length - maxVisible ? prevIndex + 1 : 0
    );
  };

  const handleLogout = () => {
    setToken(null); // Clear token
  };

  if (loading) {
    return (
      <p className="text-center mt-8 text-xl font-medium">
        Loading projects...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center mt-8 text-red-500 text-xl font-medium">
        {error}
      </p>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="grid grid-cols-12 items-center w-full mb-8">
        <div className="col-span-2 text-left">
          <h1
            className="text-5xl font-bold"
            style={{ fontFamily: "var(--font-geist-mono)", color: "black" }}
          >
            QuickFund
          </h1>
        </div>
        <nav className="col-span-10 flex justify-end items-center gap-4">
          <input
            type="search"
            placeholder="Search"
            className="p-2 pl-10 text-sm text-black border border-gray-400 rounded-lg w-80"
          />
          <select className="bg-white border border-gray-400 p-2 text-sm rounded-lg text-gray-700">
            <option value="category 1">Technology</option>
            <option value="category 2">Community</option>
            <option value="category 3">Music</option>
            <option value="category 4">Education</option>
          </select>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            <Link href="/search"> Search</Link>
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg">
            <Link href="/createProject">Create Project</Link>
          </button>
          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Log Out
            </button>
          ) : (
            <button className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded-lg">
              <Link href="/auth">Login/Signup</Link>
            </button>
          )}
          <Link href="/profile">
            <FaUser size={30} className="cursor-pointer text-black" />
          </Link>
        </nav>
      </header>

      {/* Popular Projects Section */}
      <div>
        <h2 className="text-3xl font-bold text-black mb-6">Popular Projects</h2>
        <div className="relative w-full">
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-300 hover:bg-gray-500 p-3 rounded-full"
            onClick={handleLeftClick}
          >
            &lt;
          </button>
          <div className="flex overflow-hidden">
            <div
              className="flex transition-transform duration-300"
              style={{
                transform: `translateX(-${currentIndex * (100 / maxVisible)}%)`,
                width: `${(100 * popularProjects.length) / maxVisible}%`,
              }}
            >
              {popularProjects.map((project) => {
                console.log("Mapping project:", project);
                return (
                  <ProjectCard key={project.projectId} project={project} />
                );
              })}
            </div>
          </div>
          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-300 hover:bg-gray-500 p-3 rounded-full"
            onClick={handleRightClick}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* All Projects Section */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-black mb-6">All Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allProjects.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage * projectsPerPage >= allProjects.length}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
