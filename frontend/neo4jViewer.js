const width = document.getElementById("graph-container").clientWidth;
const height = window.innerHeight;

const svg = d3.select("svg"),
  container = svg.append("g"); // Group to allow zooming

// Define a force simulation
const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance(100)
  )
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2));

async function loadGraph() {
  try {
    const response = await fetch("http://localhost:4000/graph");
    const data = await response.json();

    console.log(data);

    // Create edges
    const link = container
      .selectAll(".link")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link");

    // Create nodes
    const node = container
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 8)
      .call(drag(simulation));

    // Add labels
    const labels = container
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .text((d) => d.label || d.id)
      .attr("dx", 10)
      .attr("dy", 3);

    // Update node and link positions on tick
    simulation.nodes(data.nodes).on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    simulation.force("link").links(data.links);
  } catch (error) {
    console.error("Error loading graph data:", error);
  }
}

// Drag functionality
function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// Zooming functionality
svg.call(
  d3
    .zoom()
    .scaleExtent([0.1, 2])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    })
);

loadGraph();
