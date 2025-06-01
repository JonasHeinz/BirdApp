import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// Komponente für ein Höhendiagramm der Sichtungen einer Vogelart
const ElevationChart = ({ latinName }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Falls kein lateinischer Name übergeben wird, keine Abfrage ausführen
    if (!latinName) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/getHoehenDiagramm?species=${encodeURIComponent(latinName)}`
        );
        const responseData = await response.json();

        // Formatieren der Daten für das Diagramm
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
          type="category"
          angle={-45}
          dataKey="elevation"
          stroke="black"
          textAnchor="end"
          interval={0}
          label={{
            value: "Höhe über Meer (m)",
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
            offset: 0,
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
