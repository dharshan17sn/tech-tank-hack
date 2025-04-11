

'use client';

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

const VolatilityChart = ({ data }: { data: any[] }) => {

  console.log(data);
  

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: "Volatility (%)", angle: -90, position: "insideLeft" }} />
        <Tooltip formatter={(value) => [`${value}%`, "Volatility"]} />
        <Bar dataKey="volatility" fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VolatilityChart;
