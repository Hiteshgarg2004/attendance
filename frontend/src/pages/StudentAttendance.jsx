import { useState, useEffect } from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import API from "../api/apiClient";

export default function StudentAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);

  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  // Anti-cheating: Device tracking
  const [deviceId, setDeviceId] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const [locationError, setLocationError] =
    useState("");

  /* =========================================================
     GENERATE DEVICE ID
  ========================================================= */
  useEffect(() => {
    const generateDeviceId = () => {
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
      ].join("|");

      let hash = 0;

      for (
        let i = 0;
        i < fingerprint.length;
        i++
      ) {
        const char =
          fingerprint.charCodeAt(i);

        hash =
          ((hash << 5) - hash) + char;

        hash = hash & hash;
      }

      return (
        "device-" +
        Math.abs(hash).toString(36)
      );
    };

    setDeviceId(generateDeviceId());
  }, []);

  /* =========================================================
     GET LOCATION
  ========================================================= */
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported"
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,
        });

        setLocationError("");
      },

      (error) => {
        console.error(
          "Location error:",
          error
        );

        setLocationError(
          "Unable to get location"
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  /* =========================================================
     GET QR PARAMS FROM URL
  ========================================================= */
  useEffect(() => {
    const token =
      searchParams.get("token");

    const classId =
      searchParams.get("classId");

    const timestamp =
      searchParams.get("timestamp");

    const signature =
      searchParams.get("signature");

    if (
      token &&
      classId &&
      timestamp &&
      signature
    ) {
      setQrData({
        token,
        classId,
        timestamp,
        signature,
      });
    } else {
      setMessage("Invalid QR code");

      setMessageType("error");
    }
  }, [searchParams]);

  /* =========================================================
     SUBMIT ATTENDANCE
  ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!qrData || !rollNo) return;

    setLoading(true);

    setMessage("");

    try {
      const res = await API.post(
        "/attendance/qr/verify",
        {
          token: qrData.token,

          classId: qrData.classId,

          timestamp:
            qrData.timestamp,

          signature:
            qrData.signature,

          rollNo: rollNo.trim(),

          name: name.trim(),

          deviceId,

          location,
        }
      );

      setMessage(
        res.data.message ||
          "Attendance marked successfully!"
      );

      setMessageType("success");

      // Optional redirect after success
      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Failed to mark attendance"
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INVALID QR
  ========================================================= */
  if (!qrData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-blue-600 rounded-3xl shadow-2xl w-full max-w-md p-8">

          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Invalid QR Code
          </h2>

          <p className="text-blue-100 text-center">
            Please scan a valid attendance QR code.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">

      <div className="bg-blue-600 rounded-3xl shadow-2xl w-full max-w-md p-8">

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Mark Attendance
        </h2>

        {/* SUCCESS / ERROR MESSAGE */}
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm text-center ${
              messageType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* LOCATION WARNING */}
        {locationError && (
          <div className="mb-4 p-3 rounded text-sm text-center bg-yellow-100 text-yellow-700">
            {locationError}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* ROLL NUMBER */}
          <div>
            <label className="block text-white font-medium mb-2">
              Roll Number
            </label>

            <input
              type="text"
              placeholder="Enter your roll number"
              value={rollNo}
              onChange={(e) =>
                setRollNo(e.target.value)
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              required
            />
          </div>

          {/* NAME */}
          <div>
            <label className="block text-white font-medium mb-2">
              Name (Optional)
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl bg-white text-blue-600 font-semibold shadow-lg transition-all duration-300 ${
              loading
                ? "opacity-70 cursor-not-allowed"
                : "hover:scale-105"
            }`}
          >
            {loading
              ? "Marking Attendance..."
              : "Mark Attendance"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="mt-6 text-blue-100 text-xs text-center">
          Attendance will be verified securely.
        </p>
      </div>
    </div>
  );
}
