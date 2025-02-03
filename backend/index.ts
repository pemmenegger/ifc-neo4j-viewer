import express from "express";
import cors from "cors";
import { getGraphData } from "./neo4j";

const app = express();
app.use(cors());

app.get("/graph", async (req, res) => {
  try {
    const data = await getGraphData();
    res.json(data);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
44;

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
