import Link from "next/link";

interface Project {
  projectID: string;
  title: string;
}

export default function ProjectCard({ project }: { project: Project }) {
  console.log("project_id:", project.projectID);
  return (
    <div className="w-60 border border-gray-200 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">{project.title}</h3>
      {/* Use dynamic route */}
      <Link href={`/project/${project.projectID}`}>
        <button className="bg-blue-500 text-white p-2 rounded mt-2">
          View Details
        </button>
      </Link>
    </div>
  );
}
