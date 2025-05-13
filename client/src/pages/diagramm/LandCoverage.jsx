import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const LandCoverage = ({ latinName }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!latinName) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/getLandcover?latinName=${encodeURIComponent(latinName)}`
        );
        const responseData = await response.json();

    

        setData(responseData);
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <XAxis
          dataKey="key" // <-- hier statt "landcover"
          stroke="black"
          angle={-45}
          textAnchor="end"
          interval={0}
          label={{
            value: "Bodenbedeckung",
            position: "insideBottom",
            offset: -60,
            fill: "black",
          }}
        />
        <YAxis
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
        <Bar dataKey="count" label={{ position: "top" }}>
          {data.map((entry, index) => {
            console.log(entry.color); // Überprüfe den Farbwert
            return <Cell key={`cell-${index}`} fill={entry.color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LandCoverage;
