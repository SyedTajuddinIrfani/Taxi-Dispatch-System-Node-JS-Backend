const TemplateModel = require("../models/templateModel");

const TemplateController = {

  getTemplateTypes: async (req, res) => {
    try {
      const templateTypes = await TemplateModel.getAllTemplateTypes();
      return res.json({
        status: true,
        template_types: templateTypes
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getTemplatesByType: async (req, res) => {
    try {
      const { template_type_id } = req.query;

      if (!template_type_id) {
        return res.status(400).json({
          status: false,
          message: "template_type_id is required"
        });
      }

      const templates = await TemplateModel.getTemplatesByTypeId(template_type_id);

      return res.json({
        status: true,
        templates
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }
};

module.exports = TemplateController;
