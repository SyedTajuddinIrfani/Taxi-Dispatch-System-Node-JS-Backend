const db = require("../db");

const TemplateModel = {
  getAllTemplateTypes: async () => {
    const { rows } = await db.query(
      `SELECT id, name FROM template_types ORDER BY id ASC`
    );
    return rows;
  },

  getTemplatesByTypeId: async (templateTypeId) => {
    const { rows } = await db.query(
      `SELECT id, name 
       FROM templates 
       WHERE template_type_id = $1
       ORDER BY id ASC`,
      [templateTypeId]
    );
    return rows;
  }
};

module.exports = TemplateModel;
