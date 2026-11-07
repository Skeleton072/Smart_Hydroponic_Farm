const express = require("express");
const { addNewNode, getAllNodes, updateNode, deleteNode } = require("../controllers/node.controller");

const nodeRouter = express.Router();

nodeRouter.post('/addNewNode', addNewNode);
nodeRouter.patch('/updateNode/:node_id', updateNode);
nodeRouter.get('/getAllNodes', getAllNodes);
nodeRouter.delete('/deleteNode/:node_id', deleteNode);

module.exports = nodeRouter;