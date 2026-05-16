import React from 'react';

function AppCard({ app, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${app.color} rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95`}
    >
      <div className="text-4xl mb-2 text-center">{app.icon}</div>
      <div className="text-white text-center text-sm font-medium opacity-90">{app.name}</div>
    </div>
  );
}

export default AppCard;
