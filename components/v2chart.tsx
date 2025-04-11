
'use client';

import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line
} from 'recharts';

const TrendLineChart = ({ trendData }: { trendData: Record<string, any[]> }) => {
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
        <YAxis label={{ value: "Price (₹/kg)", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        {Object.entries(trendData)
          .slice(0, 5)
          .map(([cropName, data], index) => (
            <Line
              key={cropName}
              data={data}
              type="monotone"
              dataKey="price"
              name={cropName}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendLineChart;
