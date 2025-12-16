const CallEventModel = require("../models/callEventModel");

exports.receiveCallEvents = async (req, res) => {
  try {
    const { token, events } = req.body;

    if (!token || !Array.isArray(events)) {
      return res.status(400).json({
        message: "Invalid payload. Token and events array are required.",
      });
    }

    const batchId = await CallEventModel.createBatch(token);
    await CallEventModel.insertEvents(batchId, events);

    res.status(200).json({
      message: "Call Events Saved Successfully.",
      batchId,
      events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getCallEvents = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required." });
    }

    const events = await CallEventModel.getEventsByToken(token);

    if (events.length === 0) {
      return res.status(404).json({
        message: "No call events found for this token.",
      });
    }

    res.status(200).json({
      message: "Call events retrieved successfully.",
      data: events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteCallEvents = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is Required." });
    }

    const deleted = await CallEventModel.deleteEventsByToken(token);

    if (deleted === 0) {
      return res.status(404).json({
        message: "No call events found for this token.",
      });
    }

    res.status(200).json({
      message: "Call Events Deleted Successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
