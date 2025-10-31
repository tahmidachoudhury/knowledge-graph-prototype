import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
} from "d3-force";

const simulation = forceSimulation(nodes)
  .force(
    "link",
    forceLink(links)
      .id((d) => d.id)
      .distance(50)
  )
  .force("charge", forceManyBody().strength(-30))
  .force("center", forceCenter(width / 2, height / 2))
  .stop();

// Run the simulation manually for N iterations
for (let i = 0; i < 300; ++i) simulation.tick();

// Now your nodes have x, y coordinates
console.log(nodes[0]); // { id: "topic1", x: 100, y: 250 }
