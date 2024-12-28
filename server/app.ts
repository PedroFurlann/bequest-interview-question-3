import express from "express";
import cors from "cors";

const PORT = 8080;
const app = express();
const database = { data: "Hello World", signature: "" };

app.use(cors());
app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.json(database);
});

app.post("/", (req, res) => {
  const { data, signature } = req.body;
  if (!signature) {
    return res.status(400).json({ error: "Signature is required" });
  }
  database.data = data || database.data;
  database.signature = signature;
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
