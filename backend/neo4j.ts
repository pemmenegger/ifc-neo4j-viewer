import neo4j from "neo4j-driver";
import dotenv from "dotenv";
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

export async function getGraphData() {
  const session = driver.session();
  try {
    const result = await session.run(`
            MATCH (n)-[r]->(m)
            RETURN n, r, m
        `);

    const nodes = new Map();
    const links: any[] = [];

    result.records.forEach((record) => {
      const sourceNode = record.get("n").properties;
      const targetNode = record.get("m").properties;
      const relationship = record.get("r").type;

      console.log(sourceNode, targetNode, relationship);

      nodes.set(sourceNode.Name, { id: sourceNode.Name, ...sourceNode });
      nodes.set(targetNode.Name, { id: targetNode.Name, ...targetNode });

      links.push({
        source: sourceNode.Name,
        target: targetNode.Name,
        type: relationship,
      });
    });

    return { nodes: Array.from(nodes.values()), links };
  } finally {
    await session.close();
  }
}
