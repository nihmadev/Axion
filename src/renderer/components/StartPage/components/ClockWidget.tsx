import React from 'react';

interface ClockWidgetProps {
  time: string;
  date: string;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ time, date }) => {
  return (
    <div className="clock-widget">
      <div className="clock-time">{time}</div>
      <div className="clock-date">{date}</div>
    </div>
  );
};
