import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SimulationNodeDatum } from "d3";

interface Node extends SimulationNodeDatum {
  id: string;
  labels: string[];
  properties: any;
}

interface Link {
  source: string;
  target: string;
  type: string;
  properties: any;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface Neo4jViewerProps {
  guid?: string;
}

// Add new interface for selected node state
interface SelectedNode {
  x: number;
  y: number;
  properties: any;
}

export default function Neo4jViewer({ guid }: Neo4jViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const url = guid 
          ? `/api/neo4j/graph?guid=${encodeURIComponent(guid)}`
          : '/api/neo4j/graph';
          
        const response = await fetch(url);
        const result = await response.json();

        if (result.success && result.data) {
          setGraphData(result.data);
          createForceGraph(result.data);

          // Auto-select node with matching GUID
          if (guid) {
            const matchingNode = result.data.nodes.find(
              (node: Node) => node.properties.GlobalId === guid
            );
            if (matchingNode) {
              setSelectedNode({
                x: 10, // Fixed position for the properties panel
                y: 10,
                properties: matchingNode.properties
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };

    fetchGraphData();
  }, [guid]); // Re-run effect when GUID changes

  // Add effect to clear selection when GUID is cleared
  useEffect(() => {
    if (!guid) {
      setSelectedNode(null);
    } 
  }, [guid]);

  const createForceGraph = (data: GraphData) => {
    if (!svgRef.current) return;

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add zoom functionality
    const g = svg.append("g");
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Set min and max zoom scale
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);
    
    // Add zoom controls
    const zoomControls = svg
      .append("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${width - 100}, 20)`);

    // Zoom in button
    zoomControls
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 15)
      .attr("fill", "#44aa88")
      .attr("stroke", "#ffffff")
      .attr("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoom.scaleBy as any, 1.5);
      });

    zoomControls
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", "20px")
      .text("+")
      .attr("pointer-events", "none");

    // Zoom out button
    zoomControls
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 40)
      .attr("r", 15)
      .attr("fill", "#44aa88")
      .attr("stroke", "#ffffff")
      .attr("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoom.scaleBy as any, 0.75);
      });

    zoomControls
      .append("text")
      .attr("x", 0)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", "20px")
      .text("-")
      .attr("pointer-events", "none");

    // Reset zoom button
    zoomControls
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 80)
      .attr("r", 15)
      .attr("fill", "#44aa88")
      .attr("stroke", "#ffffff")
      .attr("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

    zoomControls
      .append("text")
      .attr("x", 0)
      .attr("y", 80)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text("R")
      .attr("pointer-events", "none");

    // Define arrow markers for links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"]) // Define only one type of marker
      .enter()
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30) // Position the arrow away from the node edge
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ffffff");

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id((d: any) => d.id)
          .distance(150) // Increased distance to accommodate arrows
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create links group
    const linkGroup = g
      .append("g")
      .selectAll("g")
      .data(data.links)
      .enter()
      .append("g");

    // Create the lines for links
    const links = linkGroup
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)"); // Add arrow marker

    // Add labels for links
    const linkLabels = linkGroup
      .append("text")
      .text((d: Link) => d.type)
      .attr("class", "link-label")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle");

    // Create nodes group
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(data.nodes)
      .enter()
      .append("g");

    // Create node circles
    const nodes = nodeGroup
      .append("circle")
      .attr("class", "node")
      .attr("r", 20)
      .attr("fill", (d: Node) => {
        // Highlight the node if it matches the GUID
        return d.properties.GlobalId === guid ? "#ff6b6b" : "#44aa88";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", (event: MouseEvent, d: Node) => {
        event.stopPropagation();
        setSelectedNode({
          x: 10, // Fixed position for the properties panel
          y: 10,
          properties: d.properties
        });
      });

    // Add click handler to svg to close overlay when clicking outside
    svg.on("click", () => {
      setSelectedNode(null);
    });

    // Add labels inside nodes
    const labels = nodeGroup
      .append("text")
      .text((d: Node) => {
        const text = d.properties?.Name || d.properties?.name || d.labels[0];
        return text.length > 10 ? text.substring(0, 8) + "..." : text;
      })
      .attr("class", "label")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    // Update positions on tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      // Update node group positions
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {selectedNode && (
        <div 
          className="absolute bg-gray-800 text-white p-4 rounded-lg shadow-lg z-10"
          style={{
            left: 10,
            top: 10,
            maxWidth: '300px',
            maxHeight: '400px',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <h3 className="text-lg font-bold mb-2">Properties</h3>
          <div className="space-y-1">
            {Object.entries(selectedNode.properties).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
