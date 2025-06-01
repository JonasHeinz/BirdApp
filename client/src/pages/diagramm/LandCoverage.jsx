import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Diagramm-Komponente für Bodenbedeckung
const LandCoverage = ({ latinName }) => {
  const [data, setData] = useState([]);

  // Wenn sich der lateinische Name ändert, lade neue Daten
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

  // Wenn kein Name übergeben wurde, nichts anzeigen
  if (!latinName) return null;

  // Wenn keine Daten verfügbar sind, Hinweis anzeigen
  if (data.length === 0) {
    return <p>Es gibt keine Daten für dieses Diagramm.</p>;
  }

  return (
    // Responsive Container sorgt dafür, dass sich das Diagramm an die Größe des Eltern-Containers anpasst
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 70 }}>
        <XAxis
          dataKey="key"
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
            offset: 0,
            fill: "black",
            dy: 30,
          }}
        />
        <Tooltip />
        <Bar dataKey="count" label={{ position: "top" }}>
          {data.map((entry, index) => {
            return <Cell key={`cell-${index}`} fill={entry.color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LandCoverage;
