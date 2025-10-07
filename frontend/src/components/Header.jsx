import { Link, useNavigate } from "react-router-dom";

export default function Header({ teacher, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="bg-white/20 backdrop-blur-xl shadow-md px-6 py-4 flex justify-between items-center">
      {/* Logo / App Name */}
      <div className="text-2xl font-bold text-blue-700 cursor-pointer" onClick={() => navigate("/")}>
        NITJ Attendance
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-6">
        <Link
          to="/"
          className="text-gray-800 font-semibold hover:text-blue-600 transition-colors"
        >
          Dashboard
        </Link>
        {/* You can add more links here if needed */}
        <span className="text-gray-600">|</span>
        <span className="text-gray-700 font-medium">Hello, {teacher.username}</span>
        <button
          onClick={handleLogout}
          className="ml-4 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
