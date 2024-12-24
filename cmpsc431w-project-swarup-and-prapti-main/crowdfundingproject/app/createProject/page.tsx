"use client";

import { useState } from "react";
import { useUser } from "../components/userContext";

export default function CreateProject() {
  const [formData, setFormData] = useState({
    title: "",
    goal: "",
    faq: "",
    category: "",
    startDate: "",
    endDate: "",
    tags: "",
    rewards: [{ description: "", minDonation: "" }],
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { token } = useUser(); // Access the user context to get the token

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRewardChange = (index: number, field: string, value: string) => {
    const updatedRewards = [...formData.rewards];
    updatedRewards[index] = { ...updatedRewards[index], [field]: value };
    setFormData((prevData) => ({
      ...prevData,
      rewards: updatedRewards,
    }));
  };

  const addReward = () => {
    setFormData((prevData) => ({
      ...prevData,
      rewards: [...prevData.rewards, { description: "", minDonation: "" }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate form fields
    if (
      !formData.title ||
      !formData.goal ||
      !formData.faq ||
      !formData.category ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setError("Please fill in all required fields before submitting.");
      setIsLoading(false);
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("Start date must be before end date.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("User is not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/createproject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass the token in the header
        },
        body: JSON.stringify({
          title: formData.title,
          goal: parseFloat(formData.goal),
          faq: formData.faq,
          category: formData.category,
          startDate: formData.startDate,
          endDate: formData.endDate,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
          rewards: formData.rewards,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create project.");
      }

      setSubmitted(true);
      setFormData({
        title: "",
        goal: "",
        faq: "",
        category: "",
        startDate: "",
        endDate: "",
        tags: "",
        rewards: [{ description: "", minDonation: "" }],
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-green-100">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Project Created Successfully!
        </h1>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Create Another Project
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl text-black font-bold text-center mb-6">
          Create a New Project
        </h1>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <input
            type="text"
            name="title"
            placeholder="Enter project title"
            value={formData.title}
            onChange={handleChange}
            className="w-full mb-4 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
          />
          {/* FAQ */}
          <div className="mb-4">
            <label
              htmlFor="faq"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              FAQ
            </label>
            <textarea
              id="faq"
              name="faq" // Must match the key in formData
              value={formData.faq}
              onChange={handleChange} // Pass handleChange here
              placeholder="Write project FAQs"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              rows={4}
              required
            ></textarea>
          </div>

          {/* Funding Goal */}
          <div className="mb-4">
            <label
              htmlFor="goal"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Funding Goal ($)
            </label>
            <input
              type="number"
              id="goal"
              name="goal" // Must match the key in formData
              value={formData.goal}
              onChange={handleChange} // Pass handleChange here
              placeholder="Enter funding goal"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label
              htmlFor="startDate"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate" // Must match the key in formData
              value={formData.startDate}
              onChange={handleChange} // Pass handleChange here
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label
              htmlFor="endDate"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate" // Must match the key in formData
              value={formData.endDate}
              onChange={handleChange} // Pass handleChange here
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              name="category" // Must match the key in formData
              value={formData.category}
              onChange={handleChange} // Pass handleChange here
              className="w-full text-gray-400 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              <option value="Technology">Technology</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="Arts">Arts</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags" // Must match the key in formData
              value={formData.tags}
              onChange={handleChange} // Pass handleChange here
              placeholder="e.g., #innovation, #healthcare"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-red-500 mt-4">{error}</p>}
          <div className="mb-4">
            <label
              htmlFor="rewards"
              className="block text-sm font-semibold text-gray-600 mb-1"
            >
              Rewards
            </label>
            {formData.rewards.map((reward, index) => (
              <div key={index} className="mb-4">
                <textarea
                  placeholder="Reward description"
                  value={reward.description}
                  onChange={(e) =>
                    handleRewardChange(index, "description", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 mb-2"
                  required
                ></textarea>
                <input
                  type="number"
                  placeholder="Minimum donation"
                  value={reward.minDonation}
                  onChange={(e) =>
                    handleRewardChange(index, "minDonation", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addReward}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add Reward
            </button>
          </div>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Project"}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
}
