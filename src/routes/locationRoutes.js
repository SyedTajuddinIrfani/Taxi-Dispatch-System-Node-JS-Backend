const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

router.post("/", locationController.create);
router.get("/get", locationController.getAll);
router.get("/:id", locationController.getById);
router.post("/:id", locationController.update);
router.delete("/delete/:id", locationController.remove);

module.exports = router;
