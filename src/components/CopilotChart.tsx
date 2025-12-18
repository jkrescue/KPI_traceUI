import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CopilotChartProps {
  type: 'pie' | 'bar' | 'table';
  data: any[];
  title?: string;
  onItemClick?: (item: any) => void;
}

const COLORS = {
  achieved: '#22c55e',
  unachieved: '#ef4444',
  partial: '#f59e0b',
  sysml: '#8b5cf6',
  simulink: '#3b82f6',
  modelica: '#ec4899',
  fmu: '#f59e0b',
  none: '#94a3b8',
};

export const CopilotChart: React.FC<CopilotChartProps> = ({ type, data, title, onItemClick }) => {
  if (type === 'pie') {
    return (
      <div className="my-4 p-4 bg-gray-50 rounded-lg">
        {title && <h4 className="mb-3">{title}</h4>}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              onClick={onItemClick}
              style={{ cursor: onItemClick ? 'pointer' : 'default' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.none} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="my-4 p-4 bg-gray-50 rounded-lg">
        {title && <h4 className="mb-3">{title}</h4>}
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#3b82f6"
              onClick={onItemClick}
              style={{ cursor: onItemClick ? 'pointer' : 'default' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="my-4 overflow-x-auto">
        {title && <h4 className="mb-3">{title}</h4>}
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(data[0] || {}).map(key => (
                <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr 
                key={idx}
                className={onItemClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                onClick={() => onItemClick?.(row)}
              >
                {Object.values(row).map((val, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-300 px-4 py-2">
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};
