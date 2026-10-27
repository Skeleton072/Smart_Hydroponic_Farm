const supabase = require("../config/supabase");

async function addNewNode(req, res) {
  try {
    const {
      node_name,
      min_temperature,
      max_temperature,
      min_humidity,
      max_humidity,
      min_pH,
      max_pH,
      min_tds,
      max_tds,
    } = req.body;

    const { data, error } = await supabase
      .from("Nodes")
      .insert({
        node_name,
        min_temperature,
        max_temperature,
        min_humidity,
        max_humidity,
        min_pH,
        max_pH,
        min_tds,
        max_tds,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    console.log("Successfully uploaded new node.");
    return res
      .status(200)
      .json({
        message: "Successfully uploaded new node",
        node_id: data.node_id,
      });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: error.message });
  }
}

// need transaction??
async function getAllNodes(req, res) {
  try {
    const { data, error } = await supabase
      .from("Nodes")
      .select(
        "node_id, node_name, min_temperature, max_temperature, min_humidity, max_humidity, min_pH, max_pH, min_tds, max_tds",
      );

    if (error) return res.status(400).json({ message: error.message });

    console.log("Successfully selected all nodes");
    // return data;

    return res.status(200).json({ data });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ message: error.message });
  }
}

async function updateNode(req, res) {
  try {
    const {
      node_name,
      node_id,
      min_temperature,
      max_temperature,
      min_humidity,
      max_humidity,
      min_pH,
      max_pH,
      min_tds,
      max_tds,
    } = req.body;

    const { _, error } = await supabase.from("Nodes").update({
      node_name,
      min_temperature,
      max_temperature,
      min_humidity,
      max_humidity,
      min_pH,
      max_pH,
      min_tds,
      max_tds,
    }).eq('node_id', node_id);

    if (error) return res.status(400).json({ message: error.message });

    return res.status(200).json({ message: "Successfully updated."});
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: error.message });
  }
}

async function deleteNode(req, res) {
  try {
    const { node_id } = req.body;

    const { _, error } = await supabase
      .from("Nodes")
      .delete()
      .eq("node_id", node_id);

    if (error) return res.status(400).json({ message: error.message });

    return res.status(200).json({ message: "Successfully deleted."});
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { addNewNode, getAllNodes, updateNode, deleteNode };
