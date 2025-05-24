import { FixedSizeList } from "react-window";
import { useMediaQuery } from "@mui/material";
import React from "react";

// Custom ListboxComponent for virtualization
const LISTBOX_PADDING = 8;

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

const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 48;

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