import React from 'react';

function AppCard({ app, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${app.color} rounded-2xl p-6 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl`}
    >
      <div className="text-5xl mb-3 text-center">
        {app.icon}
      </div>
      <div className="text-white text-center font-medium">
        {app.name}
      </div>
    </div>
  );
}

export default AppCard;
