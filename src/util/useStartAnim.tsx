// Editing this page requires manual reload:
// https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports

import { Node } from "@antv/x6";
import { useState } from "react";

export interface NodeColorCodes {
  default: String
  start: String
  orgasm: String
  fixed: String
}

/**
 * @returns A stateful value to manage the starting node of a given animation
 */
export function useStartAnim(initialState: Node | (() => Node), colors: NodeColorCodes): [Node, (state: Node | ((prevState: Node) => Node)) => void]
{
  const [state, setState] = useState(initialState)
  const isFunction = (value: any): value is Function => typeof value === 'function'
  const setNodeColor = (cell: Node, color: String) => {
    cell.prop('color', color)
  }

  const updateState = (arg: Node | ((prevState: Node) => Node)) => {
    const cell = isFunction(arg) ? arg(state) : arg;
    if (state) {
      state.data = { isStartNode: false };
      var color: String;
      if (state.data.isOrgasm) {
        color = colors.orgasm;
      } else if (state.data.isFixed) {
        color = colors.fixed;
      } else {
        color = colors.default;
      }
      setNodeColor(state, color);
    }
    cell.data = { isStartNode: true };
    setNodeColor(cell, colors.start);
    setState(cell);
  }

  return [state, updateState];
}
