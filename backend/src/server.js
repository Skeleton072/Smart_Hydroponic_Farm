const path = require("path");
const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
});

const express = require("express");
const cors = require("cors");
const nodeRouter = require("./routes/nodeRoute");
const app = express();

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  console.log("Hello World");

  return res.status(200).json({ message: "Hello World" });
})
app.use('/api/node', nodeRouter);

app.listen(3000, () => {
  console.log("Server is listening at port 3000");
});