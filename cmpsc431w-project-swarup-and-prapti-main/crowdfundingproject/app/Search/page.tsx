"use client";

import { useState } from "react";
import ProjectCard from "../components/ProjectCard";

type Project = {
  projectID: number;
  title: string;
  goalAmt: number;
  raisedAmt: number;
  startDate: string;
  endDate: string;
  status: string;
  FAQ: string | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Track selected tags
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = ["Technology", "Education", "Music", "Community"]; // Available tags

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSearch = async () => {
    if (!query.trim() && selectedTags.length === 0) {
      alert("Please enter a search query or select at least one tag.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagParam = selectedTags.join(",");
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&tags=${encodeURIComponent(tagParam)}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: Project[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching search results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex flex-col items-center mb-8">
        <input
          type="text"
          placeholder="Search projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 text-sm text-black border border-gray-400 rounded-lg w-full max-w-lg"
        />

        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <label key={tag} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagToggle(tag)}
                className="mr-2"
              />
              {tag}
            </label>
          ))}
        </div>

        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg mt-4"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map((project) => (
          <ProjectCard key={project.projectID} project={project} />
        ))}
      </div>
    </div>
  );
}
