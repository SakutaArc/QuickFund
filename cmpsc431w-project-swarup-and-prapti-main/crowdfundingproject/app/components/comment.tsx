import React, { useState, useEffect } from "react";

export default function Comments({ projectId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/comments?projectId=${projectId}`);
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }

    fetchComments();
  }, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId: 1, // Replace with logged-in user's ID
          content: newComment,
          parentCommentId: replyingTo,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setReplyingTo(null);
        const updatedComments = await response.json();
        setComments((prev) => [...prev, updatedComments]);
      } else {
        console.error("Failed to post comment.");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  }

  return (
    <div>
      <h2>Comments</h2>
      <ul>
        {comments.map((comment) => (
          <li key={comment.comment_id}>
            <p>
              <strong>{comment.username}:</strong> {comment.content}
            </p>
            <small>{comment.date_posted}</small>
            <button onClick={() => setReplyingTo(comment.comment_id)}>
              Reply
            </button>
            <ul>
              {comment.replies.map((reply) => (
                <li key={reply.comment_id}>
                  <p>
                    <strong>{reply.username}:</strong> {reply.content}
                  </p>
                  <small>{reply.date_posted}</small>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            replyingTo ? "Write your reply..." : "Write a comment..."
          }
        ></textarea>
        <button type="submit">Post</button>
      </form>
    </div>
  );
}
