// controllers/combinedController.js
const CombinedModel = require("../models/combinedVehicleTypeAccountModel");

exports.getVehicleTypeAndAccounts = async (req, res) => {
  try {
    // Parallel API calls for better performance 🚀
    const [vehicleTypes, accounts] = await Promise.all([
      CombinedModel.fetchVehicleTypes(),
      CombinedModel.fetchAccounts()
    ]);

    // Filtered fields (you can adjust as needed)
    const filteredVehicleTypes = vehicleTypes.map(v => ({
      id: v.id,
      name: v.name
    }));

    const filteredAccounts = accounts.map(a => ({
      id: a.id,
      name: a.name,
      code: a.code,
      account_type: a.account_type
    }));

    // Combined response
    const response = {
      status: true,
      message: "Fetched Vehicle Types and Accounts successfully",
      vehicle_types_count: filteredVehicleTypes.length,
      accounts_count: filteredAccounts.length,
      vehicle_types: filteredVehicleTypes,
      accounts: filteredAccounts
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error fetching combined data:", error.message);
    res.status(500).json({
      status: false,
      message: "Error fetching combined data",
      error: error.message
    });
  }
};
