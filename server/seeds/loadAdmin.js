const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { MONGO_URI } = require("../config/config");

const Admin = require("../models/Admin");

const loadAdmin = () => {
  return new Promise(async () => {
    console.log("Connecting to DB...");
    mongoose.connect(MONGO_URI);

    console.log("DB connected!");

    const adminData = {
      name: "EK PAHAL",
      email: "admin@example.com",
      phone: "9999999999",
      admin_id: "ADMIN0001",
      uuid: randomUUID(),
      status: 1,
    };

    const password = "ChangeMe@123";
    const salt = await bcrypt.genSalt(10);
    adminData.passCopy = password;
    adminData.password = await bcrypt.hash(password, salt);

    adminData.txnPassCopy = password;
    adminData.txn_password = await bcrypt.hash(password, salt);

    const admin = new Admin(adminData);

    await admin.save();

    console.log("Admin created");

    process.exit(1);
  });
};

loadAdmin();
