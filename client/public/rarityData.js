const rarityData = [
    { key: "neverobserved", name: "Nie beobachtet", color: "#FFD700" },  // Rot
    { key: "veryrare", name: "Sehr selten", color: "#FF0000" },         // Gold
    { key: "rare", name: "Selten", color: "#FF6347" },             // Limegrün
    { key: "unusual", name: "Ungewöhnlich", color: "#98FB98" },       // Helles Grün
    { key: "common", name: "Gemein", color: "#32CD32" },              // Tomatenrot
    { key: "verycommon", name: "Sehr häufig", color: "#228B22" },       // Waldgrün
    { key: "escaped", name: "Entkommen", color: "#D3D3D3" },             // Hellgrau
            
    
  ];
  const getRarity = (key) => rarityData.find((r) => r.key === key);

  export { rarityData, getRarity };


