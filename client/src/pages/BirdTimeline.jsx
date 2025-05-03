import { useState } from "react";
import { Slider, Typography, Box } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const vogelData = [
  { date: "2025-01-01", count: 10 },
  { date: "2025-01-15", count: 15 },
  { date: "2025-02-01", count: 7 },
  { date: "2025-03-01", count: 20 },
];

const timestamps = vogelData.map(d => new Date(d.date).getTime());
const min = Math.min(...timestamps);
const max = Math.max(...timestamps);

export default function VogelZeitstrahl() {
  const [range, setRange] = useState([min, max]);

  const handleChange = (event, newValue) => {
    setRange(newValue);
  };

  const filtered = vogelData.filter(d => {
    const time = new Date(d.date).getTime();
    return time >= range[0] && time <= range[1];
  });

  return (
    <Box p={4}>
      {/* <Typography variant="h6" gutterBottom>
        Sichtungen im gewählten Zeitraum
      </Typography> */}

      <Box height={100} position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered}>
            <XAxis
              dataKey="date"
              tickFormatter={d => new Date(d).toLocaleDateString()}
              type="category"
              domain={['auto', 'auto']}
            />
            <YAxis />
            <Tooltip labelFormatter={d => new Date(d).toLocaleDateString()} />
            <Line type="monotone" dataKey="count" stroke="#2e7d32" />
          </LineChart>
        </ResponsiveContainer>

        {/* Slider exakt unterhalb der X-Achse positionieren */}
        <Box position="absolute" bottom={15} left={65} right={0}>
          <Slider
            value={range}
            onChange={handleChange}
            min={min}
            max={max}
            step={24 * 60 * 60 * 1000}
            valueLabelDisplay="auto"
            valueLabelFormat={value => new Date(value).toLocaleDateString()}
          />
        </Box>
      </Box>
    </Box>
  );
}
