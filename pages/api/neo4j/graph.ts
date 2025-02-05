import type { NextApiRequest, NextApiResponse } from "next";
import neo4j from "neo4j-driver";

type ResponseData = {
  success: boolean;
  message?: string;
  data?: {
    nodes: any[];
    links: any[];
  };
};

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const session = driver.session();
  const { guid } = req.query;

  try {
    let query: string;
    let parameters = {};

    // Choose query based on whether GUID is provided
    if (guid) {
      query = `
        MATCH (n)-[r]-(adj)
        WHERE n.GUID = $guid
        RETURN n, r, adj
      `;
      parameters = { guid };
    } else {
      query = `
        MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN n, r, m
      `;
    }

    // Execute query with parameters
    const result = await session.run(query, parameters);

    // Process nodes and relationships
    const nodes = new Map();
    const links: any[] = [];

    result.records.forEach((record) => {
      // Process start node
      const startNode = record.get("n");
      if (!nodes.has(startNode.identity.toString())) {
        nodes.set(startNode.identity.toString(), {
          id: startNode.identity.toString(),
          labels: startNode.labels,
          properties: startNode.properties,
        });
      }

      // Process relationship and end node if they exist
      const rel = record.get("r");
      const endNode = record.get(guid ? "adj" : "m");

      if (rel && endNode) {
        if (!nodes.has(endNode.identity.toString())) {
          nodes.set(endNode.identity.toString(), {
            id: endNode.identity.toString(),
            labels: endNode.labels,
            properties: endNode.properties,
          });
        }

        links.push({
          source: startNode.identity.toString(),
          target: endNode.identity.toString(),
          type: rel.type,
          properties: rel.properties,
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        nodes: Array.from(nodes.values()),
        links,
      },
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching graph data",
    });
  } finally {
    await session.close();
  }
}
