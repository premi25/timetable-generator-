import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Coordinator = () => {
  const navigate = useNavigate();
  
  const [sections, setSections] = useState(["A", "B", "C"]);
  
  // Separate room management for theory and lab
  const [theoryRooms, setTheoryRooms] = useState([]);
  const [labRooms, setLabRooms] = useState([]);
  const [newTheoryRoom, setNewTheoryRoom] = useState("");
  const [newLabRoom, setNewLabRoom] = useState("");
  
  const [facultyList, setFacultyList] = useState([
    { id: "faculty_001", name: "" },
    { id: "faculty_002", name: "" },
    { id: "faculty_003", name: "" },
    { id: "faculty_004", name: "" },
    { id: "faculty_005", name: "" },
    { id: "faculty_006", name: "" }
  ]);

  const [subjects, setSubjects] = useState([]);
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

  // Enhanced Conflict detection with room conflicts
  const detectConflictsWithRooms = (timetable) => {
    const conflicts = [];
    const teacherTimeSlots = {};
    const roomTimeSlots = {};

    timetable.forEach(daySchedule => {
      daySchedule.slots.forEach(slot => {
        if (slot.type !== 'break') {
          Object.entries(slot.sections).forEach(([section, classInfo]) => {
            if (classInfo.teacher && classInfo.teacher !== 'BREAK' && classInfo.teacher !== 'FREE') {
              // Teacher conflict detection
              const teacherKey = `${classInfo.teacher}-${daySchedule.day}-${slot.time}`;
              if (teacherTimeSlots[teacherKey]) {
                conflicts.push({
                  type: 'TEACHER_CONFLICT',
                  teacher: classInfo.teacher,
                  day: daySchedule.day,
                  time: slot.time,
                  section1: teacherTimeSlots[teacherKey],
                  section2: section,
                  subject: classInfo.subject
                });
              }
              teacherTimeSlots[teacherKey] = section;

              // Room conflict detection
              if (classInfo.room && classInfo.room !== 'NO ROOM AVAILABLE' && classInfo.room !== 'NO ROOM') {
                const roomKey = `${classInfo.room}-${daySchedule.day}-${slot.time}`;
                if (roomTimeSlots[roomKey]) {
                  conflicts.push({
                    type: 'ROOM_CONFLICT',
                    room: classInfo.room,
                    day: daySchedule.day,
                    time: slot.time,
                    section1: roomTimeSlots[roomKey],
                    section2: section,
                    subject: classInfo.subject
                  });
                }
                roomTimeSlots[roomKey] = section;
              }
            }
          });
        }
      });
    });

    setConflicts(conflicts);
    return conflicts;
  };

  // Add new theory room
  const addNewTheoryRoom = () => {
    if (newTheoryRoom.trim() && !theoryRooms.includes(newTheoryRoom.trim())) {
      setTheoryRooms([...theoryRooms, newTheoryRoom.trim()]);
      setNewTheoryRoom("");
    }
  };

  // Add new lab room
  const addNewLabRoom = () => {
    if (newLabRoom.trim() && !labRooms.includes(newLabRoom.trim())) {
      setLabRooms([...labRooms, newLabRoom.trim()]);
      setNewLabRoom("");
    }
  };

  // Remove theory room
  const removeTheoryRoom = (roomToRemove) => {
    setTheoryRooms(theoryRooms.filter(room => room !== roomToRemove));
  };

  // Remove lab room
  const removeLabRoom = (roomToRemove) => {
    setLabRooms(labRooms.filter(room => room !== roomToRemove));
  };

  // Add multiple subjects
  const addMultipleSubjects = () => {
    if (newSubjectInput.trim()) {
      const subjectNames = newSubjectInput.split(',').map(name => name.trim()).filter(name => name);
      
      const newSubjects = subjectNames.map(name => ({
        name: name,
        hasLab: true
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
    return faculty && faculty.name ? faculty.name : facultyId;
  };

  // ZERO-CONFLICT Timetable Generation with Room Conflict Prevention
  const generateTimetable = () => {
    // Validation
    if (subjects.length === 0) {
      alert("Please add at least one subject!");
      return;
    }

    if (theoryRooms.length === 0) {
      alert("Please add at least one theory room!");
      return;
    }

    if (labRooms.length === 0) {
      alert("Please add at least one lab room!");
      return;
    }

    const emptyFaculty = facultyList.find(f => !f.name.trim());
    if (emptyFaculty) {
      alert(`Please enter name for ${emptyFaculty.id}`);
      return;
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = generateTimeSlots();
    
    const facultyWorkload = {};
    const weeklyTimetable = [];
    
    // Initialize faculty workload
    facultyList.forEach(faculty => {
      facultyWorkload[faculty.id] = 0;
    });

    // Track teacher availability
    const teacherAvailability = {};
    facultyList.forEach(faculty => {
      teacherAvailability[faculty.id] = {};
      days.forEach(day => {
        teacherAvailability[faculty.id][day] = {};
        timeSlots.forEach(slot => {
          teacherAvailability[faculty.id][day][slot.time] = true;
        });
      });
    });

    // Track room availability - NEW: Prevent room conflicts
    const roomAvailability = {};
    days.forEach(day => {
      roomAvailability[day] = {};
      timeSlots.forEach(slot => {
        roomAvailability[day][slot.time] = {
          theory: [...theoryRooms], // Available theory rooms for this time slot
          lab: [...labRooms]        // Available lab rooms for this time slot
        };
      });
    });

    days.forEach((day, dayIndex) => {
      const daySchedule = { day, slots: [] };

      timeSlots.forEach((timeSlot, slotIndex) => {
        const slot = { 
          time: timeSlot.time, 
          type: timeSlot.type,
          sections: {} 
        };

        sections.forEach(section => {
          let subject, teacher, room;

          if (timeSlot.type === 'break') {
            subject = 'BREAK';
            teacher = '';
            room = '';
          } else {
            // Find available teacher for this time slot
            const availableTeachers = facultyList.filter(faculty => 
              teacherAvailability[faculty.id][day][timeSlot.time]
            );

            if (availableTeachers.length > 0) {
              // Choose teacher with least workload
              availableTeachers.sort((a, b) => facultyWorkload[a.id] - facultyWorkload[b.id]);
              const selectedTeacher = availableTeachers[0];
              
              // Select subject - simple round-robin
              const subjectIndex = (dayIndex + slotIndex + sections.indexOf(section)) % subjects.length;
              const selectedSubject = subjects[subjectIndex];
              
              subject = timeSlot.type === 'lab' && selectedSubject.hasLab 
                ? `${selectedSubject.name} Lab` 
                : selectedSubject.name;
              
              teacher = selectedTeacher.id;
              
              // NEW: Smart room assignment with conflict prevention
              if (timeSlot.type === 'lab') {
                // Get available lab rooms for this time slot
                const availableLabRooms = roomAvailability[day][timeSlot.time].lab;
                if (availableLabRooms.length > 0) {
                  // Use round-robin to distribute lab rooms
                  room = availableLabRooms[sections.indexOf(section) % availableLabRooms.length];
                  // Remove assigned room from availability for this time slot
                  roomAvailability[day][timeSlot.time].lab = availableLabRooms.filter(r => r !== room);
                } else {
                  // No lab rooms available - use theory room as fallback
                  const availableTheoryRooms = roomAvailability[day][timeSlot.time].theory;
                  room = availableTheoryRooms.length > 0 
                    ? availableTheoryRooms[0] 
                    : 'NO ROOM AVAILABLE';
                  if (availableTheoryRooms.length > 0) {
                    roomAvailability[day][timeSlot.time].theory = availableTheoryRooms.filter(r => r !== room);
                  }
                }
              } else {
                // Theory class - get available theory rooms
                const availableTheoryRooms = roomAvailability[day][timeSlot.time].theory;
                if (availableTheoryRooms.length > 0) {
                  // Use round-robin to distribute theory rooms
                  room = availableTheoryRooms[sections.indexOf(section) % availableTheoryRooms.length];
                  // Remove assigned room from availability for this time slot
                  roomAvailability[day][timeSlot.time].theory = availableTheoryRooms.filter(r => r !== room);
                } else {
                  // No theory rooms available - use lab room as fallback
                  const availableLabRooms = roomAvailability[day][timeSlot.time].lab;
                  room = availableLabRooms.length > 0 
                    ? availableLabRooms[0] 
                    : 'NO ROOM AVAILABLE';
                  if (availableLabRooms.length > 0) {
                    roomAvailability[day][timeSlot.time].lab = availableLabRooms.filter(r => r !== room);
                  }
                }
              }

              // Update tracking
              teacherAvailability[teacher][day][timeSlot.time] = false;
              facultyWorkload[teacher]++;
            } else {
              // No available teacher - assign FREE period
              subject = 'FREE';
              teacher = '';
              
              // Still assign a room for FREE periods to maintain structure
              if (timeSlot.type === 'lab') {
                const availableLabRooms = roomAvailability[day][timeSlot.time].lab;
                room = availableLabRooms.length > 0 ? availableLabRooms[0] : 'NO ROOM';
                if (availableLabRooms.length > 0) {
                  roomAvailability[day][timeSlot.time].lab = availableLabRooms.filter(r => r !== room);
                }
              } else {
                const availableTheoryRooms = roomAvailability[day][timeSlot.time].theory;
                room = availableTheoryRooms.length > 0 ? availableTheoryRooms[0] : 'NO ROOM';
                if (availableTheoryRooms.length > 0) {
                  roomAvailability[day][timeSlot.time].theory = availableTheoryRooms.filter(r => r !== room);
                }
              }
            }
          }

          slot.sections[section] = { subject, teacher, room };
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
          if (classInfo.subject !== 'BREAK' && classInfo.subject !== 'FREE') {
            flatTimetable.push({
              day: daySchedule.day,
              time: slot.time,
              section: `Section ${section}`,
              room: classInfo.room,
              subject: classInfo.subject,
              teacher: classInfo.teacher,
              type: slot.type
            });
          }
        });
      });
    });

    // Save faculty names for faculty view
    const facultyNames = {};
    facultyList.forEach(faculty => {
      facultyNames[faculty.id] = faculty.name;
    });

    // Check for conflicts
    const detectedConflicts = detectConflictsWithRooms(weeklyTimetable);

    // Save to localStorage
    localStorage.setItem("departmentTimetable", JSON.stringify(flatTimetable));
    localStorage.setItem("weeklyTimetable", JSON.stringify(weeklyTimetable));
    localStorage.setItem("facultyNames", JSON.stringify(facultyNames));
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

  // Manual conflict check function
  const handleManualConflictCheck = () => {
    if (timetableData.length === 0) {
      alert("No timetable generated yet!");
      return;
    }
    const detectedConflicts = detectConflictsWithRooms(timetableData);
    
    if (detectedConflicts.length > 0) {
      alert(`Found ${detectedConflicts.length} conflicts!`);
    } else {
      alert("✅ No conflicts found! Perfect timetable.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Timetable Generator</h1>
              <p className="text-gray-600 mt-2">Simplified Room & Lab Management</p>
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
          
          {/* Faculty Names */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Faculty Names (Required)</h3>
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

          {/* SIMPLIFIED ROOM MANAGEMENT */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Room Management</h3>
            
            {/* Theory Rooms Section */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-800">🏫 Theory Classrooms</h4>
              <p className="text-sm text-blue-600 mb-3">Add regular classrooms for theory classes</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTheoryRoom}
                  onChange={(e) => setNewTheoryRoom(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-3"
                  placeholder="Enter theory room (e.g., Room 101)"
                />
                <button
                  onClick={addNewTheoryRoom}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {theoryRooms.map((room, index) => (
                  <div key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg flex items-center gap-2">
                    🏫 {room}
                    <button
                      onClick={() => removeTheoryRoom(room)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {theoryRooms.length === 0 && (
                  <div className="text-gray-500 text-sm">No theory rooms added yet</div>
                )}
              </div>
            </div>

            {/* Lab Rooms Section */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-800">🔬 Lab Rooms</h4>
              <p className="text-sm text-green-600 mb-3">Add laboratory rooms for practical classes</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newLabRoom}
                  onChange={(e) => setNewLabRoom(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-3"
                  placeholder="Enter lab room (e.g., Lab 201)"
                />
                <button
                  onClick={addNewLabRoom}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {labRooms.map((room, index) => (
                  <div key={index} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg flex items-center gap-2">
                    🔬 {room}
                    <button
                      onClick={() => removeLabRoom(room)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {labRooms.length === 0 && (
                  <div className="text-gray-500 text-sm">No lab rooms added yet</div>
                )}
              </div>
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

          {/* Subjects - KEEPING YOUR EXISTING SUBJECT SCENARIOS */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Subjects (Add all subjects here)</h3>
            
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
                  placeholder="Programming, Data Structures, DBMS, OS, Networks"
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
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No subjects added yet. Add subjects above.
              </div>
            ) : (
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
            )}
          </div>

          <button
            onClick={generateTimetable}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Generate Timetable
          </button>
        </div>

        {/* Display Generated Timetable */}
        {timetableData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Generated Timetable</h2>
              <div className="space-x-2">
                <button
                  onClick={handleManualConflictCheck}
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
                    {conflict.type === 'TEACHER_CONFLICT' ? (
                      <>
                        <strong>{getFacultyDisplayName(conflict.teacher)}</strong> has double booking on {conflict.day} at {conflict.time} 
                        (Sections: {conflict.section1} and {conflict.section2})
                      </>
                    ) : (
                      <>
                        <strong>Room {conflict.room}</strong> has double booking on {conflict.day} at {conflict.time} 
                        (Sections: {conflict.section1} and {conflict.section2})
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <span className="text-green-700 font-medium">✅ No scheduling conflicts found!</span>
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