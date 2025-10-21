// TimetableDownload.jsx
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const TimetableDownload = ({ timetableData, sections, timingSettings, facultyList }) => {
  const timetableRef = useRef();
  const buttonRef = useRef();

  // Function to get faculty display name
  const getFacultyDisplayName = (facultyId) => {
    const faculty = facultyList.find(f => f.id === facultyId);
    return faculty && faculty.name ? faculty.name : facultyId;
  };

  const downloadTimetableAsImage = async () => {
    if (!timetableRef.current) {
      alert('No timetable data available for download!');
      return;
    }

    const button = buttonRef.current;
    const originalText = button.textContent;
    
    try {
      // Show loading message
      button.textContent = 'Generating Image...';
      button.disabled = true;

      const canvas = await html2canvas(timetableRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `department-timetable-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading timetable:', error);
      alert('Error downloading timetable. Please try again.');
    } finally {
      // Always restore button text
      button.textContent = 'Download Timetable as Image';
      button.disabled = false;
    }
  };

  if (!timetableData || timetableData.length === 0) {
    return null;
  }

  return (
    <>
      {/* Hidden timetable for capture - positioned off-screen */}
      <div 
        ref={timetableRef} 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: 0,
          backgroundColor: 'white',
          padding: '20px',
          width: '1200px'
        }}
      >
        {/* Timetable Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', borderBottom: '2px solid #333' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            Department Timetable
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
            Generated on {new Date().toLocaleDateString()} | Timing: {timingSettings.startTime} to {timingSettings.endTime}
          </p>
        </div>

        {/* Timetable Content */}
        {timetableData.map((daySchedule, dayIndex) => (
          <div key={dayIndex} style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: '#3b82f6',
              color: 'white'
            }}>
              {daySchedule.day}
            </h3>
            
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: 'bold', textAlign: 'left' }}>
                    Time
                  </th>
                  {sections.map(section => (
                    <th key={section} style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                      Section {section}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daySchedule.slots.map((slot, slotIndex) => (
                  <tr key={slotIndex}>
                    <td style={{ border: '1px solid #d1d5db', padding: '8px', fontWeight: '600' }}>
                      {slot.time}
                    </td>
                    {sections.map(section => {
                      const classInfo = slot.sections[section];
                      return (
                        <td key={section} style={{ 
                          border: '1px solid #d1d5db', 
                          padding: '8px',
                          textAlign: 'center',
                          backgroundColor: classInfo.type === 'lab' ? '#f0fdf4' : 'white'
                        }}>
                          <div style={{ marginBottom: '2px' }}>
                            <strong style={{ color: classInfo.type === 'lab' ? '#059669' : '#1f2937' }}>
                              {classInfo.subject}
                            </strong>
                          </div>
                          {classInfo.teacher && (
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>
                              {getFacultyDisplayName(classInfo.teacher)}
                            </div>
                          )}
                          {classInfo.room && classInfo.room !== 'NO ROOM AVAILABLE' && (
                            <div style={{ fontSize: '9px', color: '#374151' }}>
                              {classInfo.room}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Download Button - MATCHING THE ORIGINAL STYLING */}
      <button
        ref={buttonRef}
        onClick={downloadTimetableAsImage}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
      >
        Download Timetable as Image
      </button>
    </>
  );
};

export default TimetableDownload;