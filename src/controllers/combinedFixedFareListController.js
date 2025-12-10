const CombinedModel = require("../models/combinedFixedFareListModel");

exports.getVehicleTypeAndLocationTypes = async (req, res) => {
  try {
    // Parallel API calls for better performance 🚀
    const [vehicleTypes, locationTypes] = await Promise.all([
      CombinedModel.fetchVehicleTypes(),
      CombinedModel.fetchLocationTypes(),
    ]);

    // Filtered fields (you can adjust as needed)
    const filteredVehicleTypes = vehicleTypes.map((v) => ({
      id: v.id,
      name: v.name,
    }));

    const filteredLocationTypes = locationTypes.map((l) => ({
      id: l.id,
      name: l.name,
      shortcut: l.shortcut,
    }));

    // Combined response
    const response = {
      status: true,
      message: "Fetched Vehicle Types and Accounts successfully",
      vehicle_types_count: filteredVehicleTypes.length,
      location_types_count: filteredLocationTypes.length,
      vehicle_types: filteredVehicleTypes,
      location_types: filteredLocationTypes,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error fetching combined data:", error.message);
    res.status(500).json({
      status: false,
      message: "Error fetching combined data",
      error: error.message,
    });
  }
};
