const express = require("express");
const router = express.Router();
const locationTypeController = require("../controllers/locationTypeController");

router.post("/", locationTypeController.create);
router.get("/", locationTypeController.getAll);
router.get("/:id", locationTypeController.getById);
router.post("/:id", locationTypeController.update);
router.delete("/:id", locationTypeController.delete);

module.exports = router;
