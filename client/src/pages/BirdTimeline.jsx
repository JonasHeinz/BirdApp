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

export default function VogelZeitstrahl({ birdIds, range, setRange }) {
  const [data, setData] = useState([]);
  const [minMax, setMinMax] = useState([range[0], range[1]]);

  const [tempRange, setTempRange] = useState([range[0].getTime(), range[1].getTime()]);

  const handleChange = (event, newValue) => {
    setTempRange(newValue); // Nur den temporären Wert aktualisieren
  };

  const handleChangeCommitted = (event, newValue) => {
    const newRange = newValue.map((ts) => new Date(ts));
    setRange(newRange); // Erst hier wird App-State aktualisiert → löst API-Call aus
  };

  useEffect(() => {
    if (!birdIds || birdIds.length === 0) return;

    const url = `http://localhost:8000/getObservationsTimeline/?speciesids=${birdIds.join(
      ","
    )}&date_from=${range[0].toISOString()}&date_to=${range[1].toISOString()}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const formatted = data
          .map((item) => ({
            ...item,
            date: new Date(item.date),
            timestamp: new Date(item.date).getTime(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

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

  return (
    <Box p={4}>
      <Typography variant="h6" gutterBottom>
        Sichtungen im gewählten Zeitraum
      </Typography>

      <Box height={200} position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              type="number"
              domain={[range[0].getTime(), range[1].getTime()]}
              scale="time"
            />
            <YAxis />
            <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
            <Line dataKey="count" stroke="#2e7d32" type="monotone" dot={false} />
            <ReferenceArea
              x1={range[0].getTime()}
              x2={range[1].getTime()}
              strokeOpacity={0.3}
              fill="#81c784"
              fillOpacity={0.3}
            />
          </LineChart>
        </ResponsiveContainer>

        <Box position="absolute" bottom={-40} left={65} right={0}>
          <Slider
            value={tempRange}
            onChange={handleChange}
            onChangeCommitted={handleChangeCommitted}
            min={minMax[0].getTime()}
            max={minMax[1].getTime()}
            step={24 * 60 * 60 * 1000}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => new Date(value).toLocaleDateString()}
          />
        </Box>
      </Box>
    </Box>
  );
}
