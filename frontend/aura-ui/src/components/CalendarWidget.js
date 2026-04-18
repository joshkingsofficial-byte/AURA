import React from 'react';

function CalendarWidget() {
  const today = new Date();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentDay = today.getDate();
  
  // Generate calendar days
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="text-center p-2" />);
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDay;
    days.push(
      <div
        key={day}
        className={`text-center p-2 rounded-lg transition-all ${
          isToday
            ? 'bg-purple-500 text-white font-bold scale-110'
            : 'text-gray-300 hover:bg-gray-700'
        }`}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-3xl p-6">
      
      {/* Month/Year header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-light text-white">{currentMonth}</h3>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-gray-500 text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>

      {/* Today's events placeholder */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-white font-medium mb-3">Today's Events</h4>
        <div className="space-y-2">
          <div className="text-gray-400 text-sm">
            • No events scheduled
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarWidget;
