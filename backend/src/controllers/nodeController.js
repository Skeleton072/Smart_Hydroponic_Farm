const supabase = require("../config/supabase");

async function addNewNode(req, res) {
  try {
    console.log(req.body);

    const {
      node_name,
      min_temperature, max_temperature,
      min_humidity, max_humidity,
      min_pH, max_pH,
      min_tds, max_tds,
    } = req.body;

    const { _, error } = await supabase.from("Nodes").insert({
      node_name,
      min_temperature, max_temperature,
      min_humidity, max_humidity,
      min_pH, max_pH,
      min_tds, max_tds,
    });

    if (error) return res.status(400).json({ message: error.message });

    console.log("Successfully uploaded new node.");
    return res.status(200).json({ message: "Successfully uploaded new node" });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: error.message });
  }
}

async function getAllNodes(req, res) {
  try {
    const { data, error } = await supabase
      .from("Nodes")
      .select("node_name, min_temperature, max_temperature, min_humidity, max_humidity, min_pH, max_pH, min_tds, max_tds")

    if (error) return res.status(400).json({ message: error.message });

    console.log("Successfully selected all nodes");
    // return data;

    return res.status(200).json({ data });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { addNewNode, getAllNodes };
