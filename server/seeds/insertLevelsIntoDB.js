const config = require("../config/config");
const Level = require("../models/Level");
const mongoose = require("mongoose");

const { LEVELS } = require("../utils/levelUtils");
const MONGO_URI = config.MONGO_URI;

const insertLevelsIntoDB = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("DB connected!");

    for (let eachLevel of LEVELS) {
      const prepareData = {
        title: eachLevel.title,
        icon: eachLevel.icon,
        level: eachLevel.level,
        required_team: eachLevel.requiredDownlines,
        required_EP_bits: eachLevel.upgradeThreshold,
        upgrade_bits: eachLevel.upgradeCost,
        bits_for_upgrade: eachLevel.paymentsForUpgrade.map((each) => ({
          payment_for_level: each.payment_for_level,
          bits_type: each.payment_type,
          link_type: each.linkType,
          bits: each.amount,
        })),
        earnings_on_upgrade: {
          total_earnings: eachLevel.earningsAfterUpgrade.totalEarnings,
          deals_count: eachLevel.earningsAfterUpgrade.transactionsCount,
          bits_type:
            eachLevel.earningsAfterUpgrade.generateEarningLinks.payment_type,
          link_type:
            eachLevel.earningsAfterUpgrade.generateEarningLinks.linkType,
          deal_bits: eachLevel.earningsAfterUpgrade.generateEarningLinks.amount,
          payment_for_level:
            eachLevel.earningsAfterUpgrade.generateEarningLinks
              .payment_for_level,
        },
      };

      const data = new Level(prepareData);
      await data.save();
    }

    console.log("Levels Updated.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log("Unable to insert.", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

insertLevelsIntoDB();
