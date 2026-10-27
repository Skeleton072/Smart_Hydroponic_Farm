const express = require("express");
const { addNewNode, getAllNodes, updateNode, deleteNode } = require("../controllers/nodeController");

const nodeRouter = express.Router();

nodeRouter.post('/addNewNode', addNewNode);
nodeRouter.post('/updateNode', updateNode);
nodeRouter.get('/getAllNodes', getAllNodes);
nodeRouter.post('/deleteNode', deleteNode);

module.exports = nodeRouter;