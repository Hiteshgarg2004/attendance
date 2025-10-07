import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/apiClient";
import { useToast } from "../components/ToastProvider";

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await API.get("/classes");
        setClasses(res.data);
      } catch {
        setError("Failed to load classes. Try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <p className="p-6 text-gray-700">Loading classes...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  // Filter classes based on search term
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    // Add more sorting logic here for other properties like 'createdAt' or 'students'
    return 0;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Your Classes</h2>
        <Link
          to="/create-class"
          className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          + Add New Class
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search classes..."
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="name">Sort by Name</option>
          {/* Add more options as needed */}
        </select>
      </div>

      {sortedClasses.length === 0 ? (
        <p className="text-gray-600">No classes found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClasses.map((c) => (
            <div
              key={c._id}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition-shadow transform hover:-translate-y-1 duration-300 flex flex-col gap-2"
            >
              <Link to={`/class/${c._id}`}
                className="block mb-2">
                <h3 className="text-xl font-semibold text-gray-800">{c.name}</h3>
                <p className="text-gray-500 mt-1">Class ID: {c._id}</p>
              </Link>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm(`Delete class '${c.name}'?`)) return;
                  try {
                    await API.delete(`/classes/${c._id}`);
                    setClasses(classes.filter(cls => cls._id !== c._id));
                    showToast("Class deleted!", "success");
                  } catch (err) {
                    showToast(err.response?.data?.message || "Failed to delete class", "error");
                  }
                }}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}