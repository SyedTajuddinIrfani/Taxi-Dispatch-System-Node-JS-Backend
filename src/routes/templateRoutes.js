const express = require("express");
const router = express.Router();
const TemplateController = require("../controllers/templateController");

router.get("/template_types", TemplateController.getTemplateTypes);
router.get("/get_templates_by_types", TemplateController.getTemplatesByType);

module.exports = router;
