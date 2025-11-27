const express = require("express");
const router = express.Router();

const EmployeeExtCtrl = require("../controllers/employeeExtensionsController");

router.post("/add", EmployeeExtCtrl.add);
router.get("/getbyid/:id", EmployeeExtCtrl.getById);
router.get("/get", EmployeeExtCtrl.get);
router.post("/edit/:id", EmployeeExtCtrl.update);
router.delete("/delete/:id", EmployeeExtCtrl.delete);
router.post("/upsert", EmployeeExtCtrl.upsert);

module.exports = router;
