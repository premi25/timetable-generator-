import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Faculty() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [facultyNames, setFacultyNames] = useState({});

  // Load faculty names from localStorage
  useEffect(() => {
    const savedNames = localStorage.getItem("facultyNames");
    if (savedNames) {
      setFacultyNames(JSON.parse(savedNames));
    }
  }, []);

  // Get faculty display name
  const getFacultyDisplayName = (facultyId) => {
    return facultyNames[facultyId] || facultyId;
  };
  
  // Get timetable from localStorage
  const timetable = JSON.parse(localStorage.getItem("departmentTimetable") || "[]");
  
  // Filter classes for this faculty member
  const myClasses = timetable.filter(entry => entry.teacher === id);
  
  // Group by day
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const classesByDay = {};
  
  days.forEach(day => {
    classesByDay[day] = myClasses.filter(cls => cls.day === day)
                                 .sort((a, b) => a.time.localeCompare(b.time));
  });

  const totalHours = myClasses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {getFacultyDisplayName(id)} - Weekly Schedule
              </h1>
              <p className="text-gray-600 mt-2">
                Faculty ID: {id} | Total Hours: <span className="font-bold text-blue-600">{totalHours} hours/week</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">5-Day Weekly Timetable</h2>
          
          {myClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Classes Found
              </h3>
              <p className="text-gray-500 mb-4">
                No timetable generated yet or no classes assigned to {getFacultyDisplayName(id)}
              </p>
              <button 
                onClick={() => navigate("/")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Ask Coordinator to Generate Timetable
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {days.map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-lg text-center text-purple-700 mb-4 pb-2 border-b">
                    {day}
                  </h3>
                  
                  {classesByDay[day].length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-green-500 text-sm font-medium">No classes</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classesByDay[day].map((classItem, index) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500"
                        >
                          <div className="font-semibold text-blue-600 text-sm mb-1">
                            {classItem.time}
                          </div>
                          <div className="font-medium text-gray-800 text-sm mb-1">
                            {classItem.subject}
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{classItem.section}</span>
                            <span>{classItem.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Details */}
        {myClasses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Class Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Day</th>
                    <th className="border p-2">Time</th>
                    <th className="border p-2">Section</th>
                    <th className="border p-2">Subject</th>
                    <th className="border p-2">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {myClasses.map((classItem, index) => (
                    <tr key={index}>
                      <td className="border p-2">{classItem.day}</td>
                      <td className="border p-2">{classItem.time}</td>
                      <td className="border p-2">{classItem.section}</td>
                      <td className="border p-2">{classItem.subject}</td>
                      <td className="border p-2">{classItem.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}