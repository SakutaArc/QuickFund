"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "../../components/userContext";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params?.projectId;

  const [project, setProject] = useState<null | {
    id: number;
    title: string;
    faq: string;
    amountRaised: number | null;
    goal: number;
    start_date: string;
    end_date: string;
  }>(null);

  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card");
  const [comments, setComments] = useState<
    { commentId: number; text: string; date: string; userId: number }[]
  >([]);
  const [newComment, setNewComment] = useState<string>("");
  const [donations, setDonations] = useState<
    { donationId: number; amount: number; date: string }[]
  >([]);
  const { token } = useUser();

  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }

        const data = await response.json();
        // Handle array response
        if (Array.isArray(data) && data.length > 0) {
          const project = data[0]; // Access the first element of the array
          setProject({
            id: project.id ?? null,
            title: project.title ?? "Untitled Project",
            faq: project.faq ?? "No FAQ available",
            amountRaised: project.amountRaised
              ? parseFloat(project.amountRaised)
              : 0,
            goal: project.goal ? parseFloat(project.goal) : 0,
            start_date: project.start_date
              ? new Date(project.start_date).toLocaleDateString()
              : "N/A",
            end_date: project.end_date
              ? new Date(project.end_date).toLocaleDateString()
              : "N/A",
          });
        } else {
          throw new Error("Project data is empty or invalid.");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to fetch project details.");
      }
    }
    fetchProjectDetails();
  }, [projectId]);

  useEffect(() => {
    async function fetchDonations() {
      try {
        console.log("Fetching donations for Project ID:", projectId);

        const response = await fetch(`/api/donations/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch donations: ${response.statusText}`);
        }
        const data = await response.json();
        setDonations(
          data.map((donation: any) => ({
            amount: parseFloat(donation.donation_amt),
            date: new Date(donation.date_donated).toLocaleString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching donations:", error);
      }
    }
    fetchDonations();
  }, [projectId, token]);

  useEffect(() => {
    async function fetchComments() {
      try {
        console.log("Params:", params);

        console.log("Fetching comments for Project ID:", projectId);

        const response = await fetch(`/api/comments/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
        });
        console.log("Response status:", response);
        if (!response.ok) {
          throw new Error(`Failed to fetch comments: ${response.statusText}`);
        }
        const data = await response.json();
        setComments(
          data.map((comment: any) => ({
            commentId: comment.comment_id,
            text: comment.content,
            date: new Date(comment.date_posted).toLocaleString(),
            userId: comment.user_id,
          }))
        );
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
    fetchComments();
  }, [params, projectId, token]);

  const handleDonate = async () => {
    try {
      const response = await fetch(`/api/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          donationAmt: donationAmount,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error(`Donation failed: ${response.statusText}`);
      }

      setProject((prevProject) =>
        prevProject
          ? {
              ...prevProject,
              amountRaised: prevProject.amountRaised + donationAmount,
            }
          : null
      );
      setDonationAmount(0);
      alert("Donation successful!");
    } catch (err) {
      alert("Error processing donation. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        const response = await fetch(`/api/comments/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            content: newComment,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add comment: ${response.statusText}`);
        }

        const result = await response.json();
        setComments([
          ...comments,
          {
            commentId: result.commentId,
            text: newComment,
            date: new Date().toLocaleString(),
            userId: result.userId,
          },
        ]);
        setNewComment("");
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
      }
    }
  };

  const handleRefund = async (donationId: number, refundAmount: number) => {
    try {
      if (!refundAmount || refundAmount <= 0) {
        alert("Please enter a valid refund amount.");
        return;
      }

      const response = await fetch(`/api/refunds/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ donationId, refundAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Refund failed: ${response.statusText}`
        );
      }

      const refundData = await response.json();
      alert(refundData.message);

      // Update UI or state to reflect the refund
      setProject((prevProject) =>
        prevProject
          ? {
              ...prevProject,
              amountRaised: Math.max(
                prevProject.amountRaised - refundAmount,
                0
              ),
            }
          : null
      );

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.donationId === donationId
            ? {
                ...donation,
                amount: Math.max(donation.amount - refundAmount, 0),
                refundAmount: 0, // Reset refund amount input after successful refund
              }
            : donation
        )
      );
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund.");
    }
  };

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>;
  }

  if (!project) {
    return <p className="text-center">Loading project details...</p>;
  }

  const progressPercentage = project.goal
    ? Math.min((project.amountRaised / project.goal) * 100, 100)
    : 0;

  return (
    <div className="p-8 max-w-3xl mx-auto bg-gray-100 shadow-md rounded-lg">
      <h1 className="text-4xl font-bold mb-6 text-black text-center">
        {project.title}
      </h1>

      <section className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          About the Project
        </h2>
        <p className="text-lg text-gray-600">{project.faq}</p>
        <p className="text-lg text-gray-600">
          <strong>Start Date:</strong> {project.start_date}
        </p>
        <p className="text-lg text-gray-600">
          <strong>End Date:</strong> {project.end_date}
        </p>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Fundraising Progress
        </h2>
        <div className="mb-4">
          <p className="text-lg text-gray-600">
            <strong className="text-black">Raised:</strong> $
            {project.amountRaised.toLocaleString()} / $
            {project.goal.toLocaleString()}
          </p>
          <div className="w-full bg-gray-300 rounded-full h-6 mt-2">
            <div
              className="bg-green-500 h-6 rounded-full text-xs text-white text-center flex items-center justify-center"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(Number(e.target.value))}
            className="border p-2 rounded w-full"
            placeholder="Enter donation amount"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="Credit Card">Credit Card</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
          <button
            onClick={handleDonate}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded"
            disabled={donationAmount <= 0}
          >
            Donate Now
          </button>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          User Donations
        </h2>
        {donations.map((donation, index) => (
          <div
            key={`${donation.donationId}-${index}`}
            className="border-b pb-4 flex flex-col gap-4"
          >
            <div className="flex text-black justify-between items-center">
              <p>
                <strong>Amount:</strong> ${donation.amount.toFixed(2)} |{" "}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                max={donation.amount}
                min={0}
                placeholder="Enter refund amount"
                onChange={(e) =>
                  setDonations((prevDonations) =>
                    prevDonations.map((d) =>
                      d.donationId === donation.donationId
                        ? {
                            ...d,
                            refundAmount: parseFloat(e.target.value) || 0,
                          }
                        : d
                    )
                  )
                }
                className="border p-2 rounded w-32"
              />
              <button
                onClick={() =>
                  handleRefund(donation.donationId, donation.refundAmount || 0)
                }
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded"
                disabled={
                  !donation.refundAmount ||
                  donation.refundAmount <= 0 ||
                  donation.refundAmount > donation.amount
                }
              >
                Request Refund
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Comments</h2>
        <div className="mb-4">
          {comments.map((comment, index) => (
            <div
              key={`${comment.commentId}-${index}`}
              className="border-b pb-4 mb-4 flex justify-between items-start"
            >
              <div>
                <p className="text-gray-700">{comment.text}</p>
                <p className="text-sm text-gray-500">
                  Posted on: {comment.date} | User ID: {comment.userId}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Write a comment"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded"
          >
            Add Comment
          </button>
        </div>
      </section>
    </div>
  );
}
