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

  const fetchClasses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login again (missing session token)." );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await API.get("/classes");
      setClasses(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        setError("Session expired or unauthorized. Please login again.");
        return;
      }
      setError("Failed to load classes. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter & sort classes
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  // Calculate attendance summary
  const totalClasses = classes.length;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
        <p className="text-gray-500">Loading classes...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchClasses}
          className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Your Classes</h2>
          <p className="text-gray-500 mt-1">Manage and monitor your class attendance</p>
        </div>

        {/* Quick Stats */}
        {totalClasses > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
              <p className="text-blue-100 text-sm font-medium">Total Classes</p>
              <p className="text-3xl font-bold mt-1">{totalClasses}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-500">
              <p className="text-gray-500 text-sm font-medium">Active This Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{Math.min(totalClasses, 5)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-purple-500">
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {classes.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Search & Sort Section - Card Style */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search classes by name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
            </select>
            <Link
              to="/create-class"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Class
            </Link>
          </div>
        </div>

        {/* Classes Grid */}
        {sortedClasses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "No classes found" : "No classes yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Get started by creating your first class"
              }
            </p>
            {!searchTerm && (
              <Link
                to="/create-class"
                className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Class
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedClasses.map((c, index) => (
              <div
                key={c._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden group"
              >
                {/* Colored Accent Bar */}
                <div className={`h-1.5 bg-gradient-to-r ${
                  index % 4 === 0 ? "from-blue-500 to-blue-600" :
                  index % 4 === 1 ? "from-green-500 to-green-600" :
                  index % 4 === 2 ? "from-purple-500 to-purple-600" :
                  "from-orange-500 to-orange-600"
                }`}></div>
                
                <div className="p-5 flex flex-col flex-grow">
                  {/* Class Info */}
                  <Link to={`/class/${c._id}`} className="block mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 font-mono">ID: {c._id}</p>
                    {c.studentCount && (
                      <p className="text-gray-500 text-sm mt-2">
                        {c.studentCount} student{c.studentCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </Link>

                  {/* Action Buttons */}
                  <div className="mt-auto flex gap-2">
                    <Link
                      to={`/class/${c._id}`}
                      className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Open
                    </Link>
                    <Link
                      to={`/class/${c._id}?tab=attendance`}
                      className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Attendance
                    </Link>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Delete class '${c.name}'? This action cannot be undone.`)) return;
                        try {
                          await API.delete(`/classes/${c._id}`);
                          setClasses(classes.filter((cls) => cls._id !== c._id));
                          showToast("Class deleted successfully!", "success");
                        } catch (err) {
                          showToast(err.response?.data?.message || "Failed to delete class", "error");
                        }
                      }}
                      className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      title="Delete class"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
