const express = require("express");
const { addNewNode, getAllNodes, updateNode, deleteNode } = require("../controllers/node.controller");
const { requireAuth } = require("../middlewares/node.middleware");

const nodeRouter = express.Router();

nodeRouter.post('/addNewNode', requireAuth, addNewNode);
nodeRouter.patch('/updateNode/:node_id', requireAuth, updateNode);
nodeRouter.get('/getAllNodes', requireAuth, getAllNodes);
nodeRouter.delete('/deleteNode/:node_id', requireAuth, deleteNode);

module.exports = nodeRouter;