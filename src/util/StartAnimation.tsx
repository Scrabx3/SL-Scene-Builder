// Editing this page requires manual reload:
// https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports

import { Cell } from "@antv/x6";
import { useState } from "react";

const COLORS = {
  default: "#FFFFFF", // default node color
  start: "#ff9d00",   // start animation
  orgasm: "#d45fa5",  // orgasm stages
  fixed: "#52a855",   // fixed length stages
};

/**
 * @returns A stateful value to manage the starting node of a given animation
 */
function useStartAnim(initialState: Cell | (() => Cell)): [Cell, (state: Cell | ((prevState: Cell) => Cell)) => void]
{
  const [state, setState] = useState(initialState)
  const isFunction = (value: any): value is Function => typeof value === 'function'
  const setNodeColor = (cell: Cell, color: any) => {
    cell.attr({ body: { fill: color, }, });
  }

  const updateState = (arg: Cell | ((prevState: Cell) => Cell)) => {
    const cell = isFunction(arg) ? arg(state) : arg;
    if (state) {
      state.data = { isStartNode: false };
      var color: String;
      if (state.data.isOrgasm) {
        color = COLORS.orgasm;
      } else if (state.data.isFixed) {
        color = COLORS.fixed;
      } else {
        color = COLORS.default;
      }
      setNodeColor(state, color);
    }
    cell.data = { isStartNode: true };
    setNodeColor(cell, COLORS.start);
    setState(cell);
  }

  return [state, updateState];
}

export default useStartAnim;