const response = require("../../../config/response");
const Level = require("../../../models/Level");

const getLevelsList = async (req, res) => {
  try {
    const levelsList = await Level.find({}).lean();

    return response.successResponse(res, levelsList, "Levels list fetched.");
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getLevelsList,
};
