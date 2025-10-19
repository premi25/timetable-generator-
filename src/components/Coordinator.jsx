import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Coordinator = () => {
  const navigate = useNavigate();
  
  const [sections, setSections] = useState(["A", "B", "C"]);
  const [rooms, setRooms] = useState(["Lab 201", "Room 101", "Room 102", "Room 103"]);
  const [newRoom, setNewRoom] = useState("");
  
  // All 6 faculties with MANDATORY names
  const [facultyList, setFacultyList] = useState([
    { id: "faculty_001", name: "Premi" },
    { id: "faculty_002", name: "Pomri" },
    { id: "faculty_003", name: "Chandra" },
    { id: "faculty_004", name: "Podja" },
    { id: "faculty_005", name: "Zoya" },
    { id: "faculty_006", name: "Guna" }
  ]);

  // Default subjects + allow custom
  const [subjects, setSubjects] = useState([
    { name: "Programming", hasLab: true },
    { name: "Data Structures", hasLab: true },
    { name: "Operating Systems", hasLab: true },
    { name: "DBMS", hasLab: true },
    { name: "Computer Networks", hasLab: true },
    { name: "Python", hasLab: true },
    { name: "Java", hasLab: true }
  ]);

  const [newSubjectInput, setNewSubjectInput] = useState("");

  const [timingSettings, setTimingSettings] = useState({
    startTime: "09:00",
    endTime: "14:15",
    periodDuration: 60,
    breakDuration: 15,
    breakAfterPeriods: 2,
    labDuration: 60
  });

  const [timetableData, setTimetableData] = useState([]);
  const [facultyHours, setFacultyHours] = useState({});
  const [conflicts, setConflicts] = useState([]);

  // Convert time to minutes
  const convertToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const { startTime, endTime, periodDuration, breakDuration, breakAfterPeriods } = timingSettings;
    
    const slots = [];
    let currentTime = convertToMinutes(startTime);
    const endTimeMinutes = convertToMinutes(endTime);
    let periodCount = 0;

    while (currentTime < endTimeMinutes) {
      const periodStart = formatTime(currentTime);
      
      // Break after specified periods
      if (periodCount === breakAfterPeriods) {
        const breakEnd = currentTime + breakDuration;
        if (breakEnd <= endTimeMinutes) {
          slots.push({
            time: `${periodStart} - ${formatTime(breakEnd)}`,
            type: 'break'
          });
          currentTime = breakEnd;
          periodCount++;
          continue;
        }
      }

      const periodEnd = currentTime + periodDuration;
      if (periodEnd > endTimeMinutes) break;

      // Last 2 periods for labs
      const isLabPeriod = slots.filter(s => s.type === 'theory').length >= 3;
      
      slots.push({
        time: `${periodStart} - ${formatTime(periodEnd)}`,
        type: isLabPeriod ? 'lab' : 'theory'
      });

      currentTime = periodEnd;
      periodCount++;
    }

    return slots;
  };

  // Conflict detection
  const detectConflicts = (timetable = timetableData) => {
    const teacherConflicts = [];
    const teacherTimeSlots = {};

    timetable.forEach(daySchedule => {
      daySchedule.slots.forEach(slot => {
        if (slot.type !== 'break') {
          Object.entries(slot.sections).forEach(([section, classInfo]) => {
            if (classInfo.teacher && classInfo.teacher !== 'BREAK') {
              const key = `${classInfo.teacher}-${daySchedule.day}-${slot.time}`;
              if (teacherTimeSlots[key]) {
                teacherConflicts.push({
                  teacher: classInfo.teacher,
                  day: daySchedule.day,
                  time: slot.time,
                  section1: teacherTimeSlots[key],
                  section2: section,
                  subject: classInfo.subject
                });
              }
              teacherTimeSlots[key] = section;
            }
          });
        }
      });
    });

    setConflicts(teacherConflicts);
    return teacherConflicts;
  };

  // Add new room
  const addNewRoom = () => {
    if (newRoom.trim() && !rooms.includes(newRoom.trim())) {
      setRooms([...rooms, newRoom.trim()]);
      setNewRoom("");
    }
  };

  // Remove room
  const removeRoom = (roomToRemove) => {
    setRooms(rooms.filter(room => room !== roomToRemove));
  };

  // Add multiple subjects
  const addMultipleSubjects = () => {
    if (newSubjectInput.trim()) {
      const subjectNames = newSubjectInput.split(',').map(name => name.trim()).filter(name => name);
      
      const newSubjects = subjectNames.map(name => ({
        name: name,
        hasLab: true // Default has lab
      }));

      setSubjects([...subjects, ...newSubjects]);
      setNewSubjectInput("");
    }
  };

  // Remove subject
  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  // Update faculty name
  const updateFacultyName = (facultyId, name) => {
    const updatedFaculty = facultyList.map(faculty => 
      faculty.id === facultyId ? { ...faculty, name } : faculty
    );
    setFacultyList(updatedFaculty);
  };

  // Get faculty display name
  const getFacultyDisplayName = (facultyId) => {
    const faculty = facultyList.find(f => f.id === facultyId);
    return faculty ? faculty.name : facultyId;
  };

  // ZERO-CONFLICT Timetable Generation
  const generateTimetable = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = generateTimeSlots();
    
    const facultyWorkload = {};
    const weeklyTimetable = [];
    
    // Initialize faculty workload
    facultyList.forEach(faculty => {
      facultyWorkload[faculty.id] = 0;
    });

    // Track teacher assignments to avoid conflicts
    const teacherAssignments = {};
    days.forEach(day => {
      teacherAssignments[day] = {};
      timeSlots.forEach(slot => {
        teacherAssignments[day][slot.time] = new Set();
      });
    });

    // Track lab sessions per subject per week
    const weeklyLabSessions = {};
    subjects.forEach(subject => {
      weeklyLabSessions[subject.name] = 0;
    });

    days.forEach((day, dayIndex) => {
      const daySchedule = { day, slots: [] };
      
      // Track lab sessions for this day
      const dailyLabSessions = {};

      timeSlots.forEach((timeSlot, slotIndex) => {
        const slot = { 
          time: timeSlot.time, 
          type: timeSlot.type,
          sections: {} 
        };
        
        // Get available teachers for this time slot
        const getAvailableTeachers = (day, time) => {
          return facultyList.filter(faculty => 
            !teacherAssignments[day][time].has(faculty.id)
          );
        };

        // Assign teacher to a class
        const assignTeacherToClass = (day, time, subjectName) => {
          const availableTeachers = getAvailableTeachers(day, time);
          if (availableTeachers.length === 0) return null;

          // Choose a teacher with least workload
          availableTeachers.sort((a, b) => facultyWorkload[a.id] - facultyWorkload[b.id]);
          const teacher = availableTeachers[0];
          
          // Mark teacher as assigned for this time
          teacherAssignments[day][time].add(teacher.id);
          facultyWorkload[teacher.id]++;
          
          return teacher.id;
        };

        // Get appropriate room
        const getRoom = (section, isLab = false) => {
          if (isLab) {
            return rooms.find(room => room.includes('Lab')) || rooms[0];
          }
          return rooms[(sections.indexOf(section) + 1) % rooms.length];
        };

        sections.forEach(section => {
          let subject, teacher, room, isLabSession = false;
          
          if (timeSlot.type === 'break') {
            subject = 'BREAK';
            teacher = '';
            room = '';
          } else if (timeSlot.type === 'lab') {
            // LAB SESSION: Assign lab for subjects that have labs
            const subjectsWithLabs = subjects.filter(sub => sub.hasLab && weeklyLabSessions[sub.name] < 2);
            
            if (subjectsWithLabs.length > 0) {
              // Find subject for this section's lab
              const subjectIndex = (dayIndex + sections.indexOf(section)) % subjectsWithLabs.length;
              const labSubject = subjectsWithLabs[subjectIndex];
              
              subject = `${labSubject.name} Lab`;
              teacher = assignTeacherToClass(day, timeSlot.time, labSubject.name);
              room = getRoom(section, true);
              isLabSession = true;
              
              if (teacher) {
                weeklyLabSessions[labSubject.name]++;
              }
            }
            
            // If no lab assigned, assign theory class
            if (!teacher) {
              const theorySubjects = subjects;
              const subjectIndex = (slotIndex + sections.indexOf(section)) % theorySubjects.length;
              subject = theorySubjects[subjectIndex].name;
              teacher = assignTeacherToClass(day, timeSlot.time, subject);
              room = getRoom(section, false);
            }
          } else {
            // THEORY CLASS - Always assign teacher
            const availableSubjects = subjects;
            const subjectIndex = (slotIndex + dayIndex + sections.indexOf(section)) % availableSubjects.length;
            subject = availableSubjects[subjectIndex].name;
            teacher = assignTeacherToClass(day, timeSlot.time, subject);
            room = getRoom(section, false);
          }

          // Fallback if no teacher assigned
          if (!teacher && timeSlot.type !== 'break') {
            const availableTeachers = getAvailableTeachers(day, timeSlot.time);
            if (availableTeachers.length > 0) {
              teacher = availableTeachers[0].id;
              teacherAssignments[day][timeSlot.time].add(teacher);
              facultyWorkload[teacher]++;
            } else {
              // Last resort - use first faculty
              teacher = facultyList[0].id;
            }
          }

          slot.sections[section] = { 
            subject, 
            teacher: teacher || '', 
            room: room || getRoom(section, isLabSession)
          };
        });
        
        daySchedule.slots.push(slot);
      });
      
      weeklyTimetable.push(daySchedule);
    });

    // Convert to flat format for storage
    const flatTimetable = [];
    weeklyTimetable.forEach(daySchedule => {
      daySchedule.slots.forEach(slot => {
        Object.entries(slot.sections).forEach(([section, classInfo]) => {
          flatTimetable.push({
            day: daySchedule.day,
            time: slot.time,
            section: `Section ${section}`,
            room: classInfo.room,
            subject: classInfo.subject,
            teacher: classInfo.teacher,
            type: slot.type
          });
        });
      });
    });

    // Check for conflicts
    const detectedConflicts = detectConflicts(weeklyTimetable);

    // Save to localStorage
    localStorage.setItem("departmentTimetable", JSON.stringify(flatTimetable));
    localStorage.setItem("weeklyTimetable", JSON.stringify(weeklyTimetable));
    localStorage.setItem("facultyList", JSON.stringify(facultyList));
    setTimetableData(weeklyTimetable);
    setFacultyHours(facultyWorkload);
    
    if (detectedConflicts.length > 0) {
      alert(`Timetable generated with ${detectedConflicts.length} conflicts!`);
    } else {
      alert("✅ 5-Day Timetable Generated Successfully! ZERO CONFLICTS!");
    }
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = [...subjects];
    if (field === 'hasLab') {
      newSubjects[index][field] = value === 'true';
    } else {
      newSubjects[index][field] = value;
    }
    setSubjects(newSubjects);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">MCA Timetable Generator</h1>
              <p className="text-gray-600 mt-2">ZERO CONFLICTS - All classes have teachers</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Timetable Configuration</h2>
          
          {/* Faculty Names - MANDATORY */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Faculty Names (Mandatory)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {facultyList.map(faculty => (
                <div key={faculty.id} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-24">{faculty.id}:</span>
                  <input
                    type="text"
                    value={faculty.name}
                    onChange={(e) => updateFacultyName(faculty.id, e.target.value)}
                    className="flex-1 border border-gray-300 rounded p-2 text-sm"
                    placeholder="Enter faculty name"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sections Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sections (comma separated)
            </label>
            <input
              type="text"
              value={sections.join(", ")}
              onChange={(e) => setSections(e.target.value.split(",").map(s => s.trim()))}
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="A, B, C"
            />
          </div>

          {/* Rooms Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Rooms (Lab 201 is for labs)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-3"
                placeholder="Add new room (e.g., Room 104)"
              />
              <button
                onClick={addNewRoom}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Add Room
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {rooms.map((room, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                  {room}
                  <button
                    onClick={() => removeRoom(room)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Timing Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Timing Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Start Time", type: "time", field: "startTime" },
                { label: "End Time", type: "time", field: "endTime" },
                { label: "Class Duration (min)", type: "number", field: "periodDuration" },
                { label: "Break Duration (min)", type: "number", field: "breakDuration" },
                { label: "Break After Periods", type: "number", field: "breakAfterPeriods" },
                { label: "Lab Duration (min)", type: "number", field: "labDuration" }
              ].map(({ label, type, field }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <input
                    type={type}
                    value={timingSettings[field]}
                    onChange={(e) => setTimingSettings({
                      ...timingSettings, 
                      [field]: type === 'number' ? parseInt(e.target.value) : e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Subjects (Any teacher can teach any subject)</h3>
            
            {/* Bulk Add Subjects */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Multiple Subjects (comma separated)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-3"
                  placeholder="subject1, subject2, subject3, subject4"
                />
                <button
                  onClick={addMultipleSubjects}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                >
                  Add Subjects
                </button>
              </div>
            </div>

            {/* Subjects List */}
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border p-3 rounded">
                  <div className="font-medium">{subject.name}</div>
                  
                  <select
                    value={subject.hasLab}
                    onChange={(e) => updateSubject(index, 'hasLab', e.target.value)}
                    className="border rounded p-2"
                  >
                    <option value={true}>Has Lab</option>
                    <option value={false}>No Lab</option>
                  </select>
                  
                  <div className="text-sm text-gray-600">
                    {subject.hasLab ? "2 lab sessions/week" : "Theory only"}
                  </div>
                  
                  <button
                    onClick={() => removeSubject(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={generateTimetable}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Generate ZERO-CONFLICT Timetable
          </button>
        </div>

        {/* Display Generated Timetable */}
        {timetableData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">MCA 1st Year Timetable</h2>
              <div className="space-x-2">
                <button
                  onClick={() => detectConflicts()}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Check Conflicts
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Download Timetable
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Timing:</strong> {timingSettings.startTime} to {timingSettings.endTime} | 
                <strong> Period:</strong> {timingSettings.periodDuration}min | 
                <strong> Break:</strong> {timingSettings.breakDuration}min after {timingSettings.breakAfterPeriods} periods
              </p>
            </div>

            {/* Conflict Display */}
            {conflicts.length > 0 ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-700 mb-2">⚠️ Scheduling Conflicts Found:</h4>
                {conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1">
                    <strong>{getFacultyDisplayName(conflict.teacher)}</strong> has double booking on {conflict.day} at {conflict.time} 
                    (Sections: {conflict.section1} and {conflict.section2})
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <span className="text-green-700 font-medium">✅ ZERO CONFLICTS - Perfect Schedule!</span>
              </div>
            )}

            {/* Display 5 days timetable */}
            {timetableData.map((daySchedule, dayIndex) => (
              <div key={dayIndex} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-center">{daySchedule.day}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3">Time</th>
                        {sections.map(section => (
                          <th key={section} className="border border-gray-300 p-3">
                            Section {section}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daySchedule.slots.map((slot, slotIndex) => (
                        <tr key={slotIndex} className={slot.type === 'break' ? 'bg-gray-100' : ''}>
                          <td className="border border-gray-300 p-3 font-semibold">
                            {slot.time}
                          </td>
                          {sections.map(section => (
                            <td key={section} className="border border-gray-300 p-3">
                              <div className="text-center">
                                <div className="font-medium">{slot.sections[section].subject}</div>
                                {slot.sections[section].teacher && (
                                  <div className="text-sm text-gray-600">
                                    ({getFacultyDisplayName(slot.sections[section].teacher)})
                                  </div>
                                )}
                                {slot.sections[section].room && (
                                  <div className="text-sm text-gray-500">
                                    {slot.sections[section].room}
                                  </div>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Faculty Hours Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-3">Faculty Weekly Hours</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(facultyHours).map(([facultyId, hours]) => (
                  <div key={facultyId} className="p-3 rounded border bg-white">
                    <div className="font-medium">{getFacultyDisplayName(facultyId)}</div>
                    <div className="font-bold text-blue-700">
                      {hours} hours/week
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coordinator;