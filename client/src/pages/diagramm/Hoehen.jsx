import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip  } from "recharts";

const ElevationChart = ({ latinName }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!latinName) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/getHoehenDiagramm?species=${encodeURIComponent(latinName)}`
        );
        const responseData = await response.json();
        const formatted = responseData.map((item) => ({
          elevation: item.elevation,
          count: item.count,
        }));
        setData(formatted);
      } catch (error) {
        console.error("Fehler beim Laden der Diagrammdaten:", error);
      }
    };

    fetchData();
  }, [latinName]);

  if (!latinName) return null;

  if (data.length === 0) {
    return <p>Es gibt keine Daten für dieses Diagramm.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300} >
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <XAxis
          type="category"
          angle={-45}
          dataKey="elevation"
          stroke="black"
           textAnchor="end"
          interval={0}
          label={{
            value: "Höhe (m)",
            position: "insideBottom",
            offset: -60,
            fill: "black",
          }}
        />

        <YAxis
          type="number"
          stroke="black"
          label={{
            value: "Sichtungen",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            fill: "black",
            dy: 30,
          }}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#81c784" barSize={55} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ElevationChart;
