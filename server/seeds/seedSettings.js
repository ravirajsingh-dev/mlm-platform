const mongoose = require("mongoose");
const Setting = require("../models/Setting");
const User = require("../models/User");

const config = require("../config/config");
const MONGO_URI = config.MONGO_URI;

const connectToDatabase = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("DB connected!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

// Function to seed ratio_list setting
const seedSettings = async () => {
  const data = {
    key: "ratio_list",
    value: Array.from({ length: 100000 }, (_, i) => i + 1),
  };

  try {
    const existing = await Setting.findOne({ key: data.key });
    if (existing) {
      console.log(`Setting '${data.key}' already exists.`);
    } else {
      await Setting.create(data);
      console.log(`Seeded '${data.key}' successfully!`);
    }
  } catch (error) {
    console.error(`Error seeding '${data.key}':`, error);
  }
};

// Function to seed _community_root_id setting
const seedCommunityRootId = async () => {
  try {
    const rootUser = await User.findOne({ is_root: true });
    if (!rootUser) {
      console.warn("No root user found. Aborting seed operation.");
      return;
    }

    const data = {
      key: "_community_root_id",
      value: rootUser._id.toString(),
    };

    const existing = await Setting.findOne({ key: data.key });
    if (existing) {
      console.log(`Setting '${data.key}' already exists.`);
    } else {
      await Setting.create(data);
      console.log(`Seeded '${data.key}' successfully!`);
    }
  } catch (error) {
    console.error("Error seeding '_community_root_id':", error);
  }
};

// Main function to run all seeds
async function runSeeds() {
  await connectToDatabase();

  console.log("Running seeds...");
  await seedCommunityRootId();
  await seedSettings();

  await mongoose.disconnect();
  console.log("Database connection closed.");
}

runSeeds();
