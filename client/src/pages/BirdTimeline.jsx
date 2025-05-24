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

export default function VogelZeitstrahl({ birdIds, range, setRange, startDate, endDate }) {
  const [data, setData] = useState([]);

  const [tempRange, setTempRange] = useState([range[0].getTime(), range[1].getTime()]);

  const handleChange = (event, newValue) => {
    setTempRange(newValue);
  };

  const handleChangeCommitted = (event, newValue) => {
    const newRange = newValue.map((ts) => new Date(ts));
    setRange(newRange);
  };

  useEffect(() => {
    if (!birdIds || birdIds.length === 0) return;

    const url = `http://localhost:8000/getObservationsTimeline/?speciesids=${birdIds.join(
      ","
    )}&date_from=${startDate.toISOString()}&date_to=${endDate.toISOString()}`;

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
      })
      .catch((error) => console.error("Fetch-Fehler:", error));
  }, [birdIds]);

  return (
  <Box p={2}>
    <Typography variant="h6">Zeitraum auswählen:</Typography>

    <Box height={"20vh"} position="relative">
      {birdIds.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
                type="number"
                domain={[startDate.getTime(), endDate.getTime()]}
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

          <Box position="absolute" bottom={16} left={65} right={5}>
            <Slider 
              sx={{
                color: "#2e7d32",
                "& .MuiSlider-thumb": {
                  backgroundColor: "#2e7d32",
                  "&:hover": {
                    backgroundColor: "#388e3c",
                  },
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "#bdbdbd",
                },
                "& .MuiSlider-track": {
                  backgroundColor: "#2e7d32",
                },
              }}
              size="small"
              value={tempRange}
              onChange={handleChange}
              onChangeCommitted={handleChangeCommitted}
              min={startDate.getTime()}
              max={endDate.getTime()}
              step={24 * 60 * 60 * 1000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => new Date(value).toLocaleDateString()}
            />
          </Box>
        </>
      ) : (
        <Box
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="#f5f5f5"
          borderRadius={2}
        >
          <Typography variant="body1" color="textSecondary">
            Keine Beobachtungsdaten verfügbar.
          </Typography>
        </Box>
      )}
    </Box>
  </Box>
);

}
