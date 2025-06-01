import { FixedSizeList } from "react-window";
import React from "react";

// Konstante für vertikalen Innenabstand der Liste
const LISTBOX_PADDING = 8;

/**
 * Hilfsfunktion zum Rendern eines einzelnen Listenelements
 * - Erhöht die top-Position jedes Eintrags um LISTBOX_PADDING
 * - Erwartet ein React-Element aus den übergebenen Daten
 */
function renderRow(props) {
  const { data, index, style } = props;
  const dataSet = data[index];
  return React.cloneElement(dataSet, {
    style: {
      ...style,
      top: style.top + LISTBOX_PADDING,
    },
  });
}

/**
 * Virtualisierte Listbox-Komponente für MUI Autocomplete
 * - Spart Rendering-Kosten bei langen Listen
 * - Nutzt react-window für performantes Scrolling
 */
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;

  // children in ein Array von React-Elementen umwandeln
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 48;

  // Maximale Höhe auf 8 Einträge begrenzen + Padding
  const height = Math.min(8, itemCount) * itemSize + 2 * LISTBOX_PADDING;

  return (
    <div ref={ref} {...other}>
      <FixedSizeList
        height={height}
        width="100%"
        itemSize={itemSize}
        itemCount={itemCount}
        itemData={itemData}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});
export default ListboxComponent;
