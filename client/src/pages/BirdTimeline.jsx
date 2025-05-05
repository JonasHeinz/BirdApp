import { useState, useEffect } from "react";
import { Slider, Box, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const startDate = new Date("2024-04-05T00:00:00Z");
const endDate = new Date("2025-04-05T00:00:00Z");
const min = startDate.getTime();
const max = endDate.getTime();

export default function VogelZeitstrahl({ birdIds }) {
  const [data, setData] = useState([]);
  const [minMax, setMinMax] = useState([min, max]);
  const [range, setRange] = useState([min, max]);

  useEffect(() => {
    if (!birdIds || birdIds.length === 0) return;

    const url = `http://localhost:8000/getObservationsTimeline/?speciesids=${birdIds.join(",")}&date_from=${startDate.toISOString()}&date_to=${endDate.toISOString()}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const formatted = data
          .map((item) => ({
            ...item,
            date: new Date(item.date).getTime(),
          }))
          .sort((a, b) => a.date - b.date);

        setData(formatted);

        if (formatted.length > 0) {
          const minDate = formatted[0].date;
          const maxDate = formatted[formatted.length - 1].date;
          setMinMax([minDate, maxDate]);
          setRange([minDate, maxDate]);
        }
      })
      .catch((error) => console.error("Fetch-Fehler:", error));
  }, [birdIds]);

  const handleChange = (event, newValue) => {
    setRange(newValue);
  };

  return (
    <Box p={4}>
      <Typography variant="h6" gutterBottom>
        Sichtungen im gewählten Zeitraum
      </Typography>

      <Box height={200} position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              type="number"
              domain={[range[1], range[0]]}
              scale="time"
            />
            <YAxis />
            <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
            <Line dataKey="count" stroke="#2e7d32" type="monotone" dot={false} />

            <ReferenceArea
              x1={range[0]}
              x2={range[1]}
              strokeOpacity={0.3}
              fill="#81c784"
              fillOpacity={0.3}
            />
          </LineChart>
        </ResponsiveContainer>

        <Box position="absolute" bottom={-40} left={65} right={0}>
          <Slider
            value={range}
            onChange={handleChange}
            min={minMax[0]}
            max={minMax[1]}
            step={24 * 60 * 60 * 1000}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => new Date(value).toLocaleDateString()}
          />
        </Box>
      </Box>
    </Box>
  );
}
