const express = require("express");
const { addNewNode, getAllNodes } = require("../controllers/nodeController");

const nodeRouter = express.Router();

nodeRouter.post('/addNewNode', addNewNode);
nodeRouter.get('/getAllNodes', getAllNodes);

module.exports = nodeRouter;