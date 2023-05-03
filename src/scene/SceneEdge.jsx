import { Graph } from '@antv/x6'

export const STAGE_EDGE = {
  router: {
    name: "metro",
    args: {
      padding: 15,
      startDirections: ["right"],
      endDirections: ["left", "top", "bottom"],
    },
  },
  connector: "rounded",
  attrs: {
    line: {
      stroke: "#000"
    }
  }
}

Graph.registerEdge(
  'stage_edge',
  STAGE_EDGE,
  true
);