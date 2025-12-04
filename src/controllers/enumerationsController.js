const EnumerationsModel = require("../models/enumerationsModel");

exports.getAllEnumerations = async (req, res) => {
    try {
        const subsidiary_id = req.query.subsidiary_id;
        const data = await EnumerationsModel.getAll(subsidiary_id);

        return res.json({
            status: true,
            ...data
        });
    } catch (error) {
        console.log("Error getting enumerations:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};
