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

export const STAGE_EDGE_SHAPEID = 'stage_edge';

Graph.registerEdge(
  STAGE_EDGE_SHAPEID,
  STAGE_EDGE,
  true
);