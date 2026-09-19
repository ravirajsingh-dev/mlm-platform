const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const User = require("../models/User");
const Wallet = require("../models/Wallet");

const config = require("../config/config");
const MONGO_URI = config.MONGO_URI;

const loadFirstAdminUser = () => {
  return new Promise(async () => {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);

    console.log("DB connected!");

    const userData = {
      name: "EK PAHAL",
      ccode: "91",
      phone: "9999999999",
      EP_ID: "EP9999999",
      sponsorEP: "MM0000001",
      uplineEP: "MM0000001",
      position: "left",
      city: "Jaipur",
      state: "Rajasthan",
      country: "IN",
      status: 1,
      terms_accepted: true,
      is_direct_paid: true,
      is_passive_paid: true,
      is_help_paid: true,
      is_root: true,
      uuid: randomUUID(),
      passCopy: "ChangeMe@123",
    };

    const password = "ChangeMe@123";
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(password, salt);

    const user = new User(userData);

    await user.save();

    // Create a wallet for the user
    const wallet = new Wallet({
      user: user._id,
      totalBalance: 0,
      e_cash: 0,
      upgrade: 0,
    });

    await wallet.save();

    console.log("User created");

    process.exit(1);
  });
};

loadFirstAdminUser();
