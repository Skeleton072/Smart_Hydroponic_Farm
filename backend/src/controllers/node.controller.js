const nodeService = require("../services/node.service");

// HELPER FUNCTIONS
function toHttpError(err) {
  switch (err.code) {
    case "INVALID_INPUT":
      return { status: 400, message: err.message };
    case "NODE_NOT_FOUND":
      return { status: 404, message: "Node not found." };
    case "FORBIDDEN":
      return { status: 403, message: "You do not have access to this node." };
    case "CONFLICT":
      return { status: 409, message: err.message };
    default:
      return { status: 500, message: "Something went wrong. Please try again." };
  }
}

function handleError(res, err, context) {
  console.error({ err, context }, `${context} failed`);

  const { status, message } = toHttpError(err);
  return res.status(status).json({ message });
}

/*
* POST /node/addNewNode
* Body: { node_name, min_temperature, max_temperature, min_humidity, max_humidity, min_pH, max_pH, min_tds, max_tds }
*/
async function addNewNode(req, res) {
  try {
    const node_id = await nodeService.createNode(req.body, req.user.user_id);

    return res.status(200).json({
        message: "Successfully uploaded new node",
        node_id
      });
  } catch (error) {
    return handleError(res, error, "addNewNode");
  }
}

/**
 * POST /node/getAllNodes
 */
async function getAllNodes(req, res) {
  try {
    const nodes = await nodeService.listNodes(req.user.user_id);
    return res.status(200).json({ data: nodes });
  } catch (error) {
    return handleError(res, error, "getAllNodes");
  }
}

/**
 * PATCH /node/updateNode/:node_id
 */
async function updateNode(req, res) {
  try {
    const node = await nodeService.updateNode(req.params.node_id, req.body, req.user.user_id);
    return res.status(200).json({ message: "Node updated.", node });
  } catch (err) {
    return handleError(res, err, "updateNode");
  }
}

/**
 * DELETE /node/deleteNode/:node_id
 */
async function deleteNode(req, res) {
  try {
    await nodeService.deleteNode(req.params.node_id, req.user.user_id);
    return res.status(204).end();
  } catch (err) {
    return handleError(res, err, "deleteNode");
  }
}

module.exports = { addNewNode, getAllNodes, updateNode, deleteNode };
