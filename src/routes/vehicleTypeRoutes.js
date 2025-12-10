const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const vehicleTypeController = require("../controllers/vehicleTypeController");

// Create uploads folder if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

router.get("/get", vehicleTypeController.getAll);
router.get("/getbyid/:id", vehicleTypeController.getById);
router.post("/add", upload.single("image"), vehicleTypeController.create);
router.post("/edit/:id", upload.single("image"), vehicleTypeController.update);
router.delete("/delete/:id", vehicleTypeController.remove);

module.exports = router;
