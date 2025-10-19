import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("faculty");
  const [faculty, setFaculty] = useState("faculty_001");
  const [password, setPassword] = useState("");

  // Predefined credentials
  const credentials = {
    coordinator: "coord123",
    faculty_001: "fac001",
    faculty_002: "fac002",
    faculty_003: "fac003",
    faculty_004: "fac004",
    faculty_005: "fac005",
    faculty_006: "fac006",
  };

  const handleLogin = () => {
    if (role === "coordinator" && password === credentials.coordinator) {
      navigate("/coordinator");
    } else if (role === "faculty" && password === credentials[faculty]) {
      navigate(`/faculty/${faculty}`);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Department Timetable System
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="coordinator">Coordinator</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        {role === "faculty" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faculty ID
            </label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={`faculty_00${num}`}>
                  faculty_00{num}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter password"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Login
        </button>
      </div>
    </div>
  );
}