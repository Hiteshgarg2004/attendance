import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import API from "../api/apiClient";

export default function StudentAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  
  // Anti-cheating: Device and location tracking
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  // Generate device fingerprint
  useEffect(() => {
    const generateDeviceId = () => {
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
      ].join("|");
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return "device-" + Math.abs(hash).toString(36);
    };
    
    setDeviceId(generateDeviceId());
  }, []);

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationError("");
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Unable to get location. Please enable location services.");
        // Still allow submission without location
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Get location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  // Get QR data from URL
  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setQrData(parsed);
      } catch (err) {
        console.error("Invalid QR data:", err);
        setMessage("Invalid QR code data");
        setMessageType("error");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qrData || !rollNo) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/attendance/qr/verify", {
        token: qrData.token,
        rollNo: rollNo.trim(),
        name: name.trim(),
        signature: qrData.signature,
        timestamp: qrData.timestamp,
        deviceId: deviceId,
        location: location
      });
      setMessage(res.data.message || "Attendance marked successfully!");
      setMessageType("success");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to mark attendance");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!qrData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-blue-600 rounded-3xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Scan QR Code
          </h2>
          <p className="text-blue-200 text-center">
            Please scan the QR code displayed by your teacher to mark attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-blue-600 rounded-3xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Mark Attendance
        </h2>

        {/* QR Code Display */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={searchParams.get("data")} size={150} />
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded text-sm text-center ${
            messageType === "success" 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Roll Number</label>
            <input
              type="text"
              placeholder="Enter your roll number"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Name (Optional)</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl bg-white text-blue-600 font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
            }`}
          >
            {loading ? "Marking..." : "Mark Attendance"}
          </button>
        </form>

        <p className="mt-4 text-blue-200 text-xs text-center">
          Ask your teacher if you don't have the QR code
        </p>
      </div>
    </div>
  );
}
