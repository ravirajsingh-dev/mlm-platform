const mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const emailRegex =
  /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

module.exports.isEmailValid = (email) => {
  if (!email) return false;

  if (email.length > 254) return false;

  var valid = emailRegex.test(email);
  if (!valid) return false;

  // Further checking of some things regex can't handle
  var parts = email.split("@");
  if (parts[0].length > 64) return false;

  var domainParts = parts[1].split(".");
  if (
    domainParts.some(function (part) {
      return part.length > 63;
    })
  )
    return false;

  return true;
};

module.exports.isSelfSponsorIDValid = (code) => {
  const selfSponsorIDRegex = /^EP\d{7}$/;
  return selfSponsorIDRegex.test(code);
};

module.exports.isAdminIDValid = (adminId) => {
  if (!adminId || typeof adminId !== "string") return false;
  
  // Trim whitespace
  const trimmedId = adminId.trim();
  
  // Check length first (8-15 characters as per schema)
  if (trimmedId.length < 8 || trimmedId.length > 15) return false;
  
  // Admin ID validation: alphanumeric only (letters and numbers), case-insensitive
  // Pattern: 8-15 alphanumeric characters
  const adminIDRegex = /^[A-Z0-9]+$/i;
  return adminIDRegex.test(trimmedId);
};

module.exports.isPhoneNumberValid = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

module.exports.removeArrayDuplicates = (arr) => {
  return [...new Set(arr)];
};

module.exports.generateUniqueEPinID = (length = 13) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const prefix = "EP";

  const epinId = (prefix + result).toUpperCase();

  return epinId;
};

module.exports.generateEPID = () => {
  const prefix = "EP";
  const uniqueString = uuidv4().replace(/-/g, "");

  const hash = crypto.createHash("sha1");
  hash.update(uniqueString);
  const hashedString = hash.digest("hex");

  const numericCharacters = hashedString.replace(/\D/g, "");

  const uniqueCode = prefix + numericCharacters;

  const trimmedUniqueCode = uniqueCode.substring(0, 9);

  return trimmedUniqueCode;
};

module.exports.comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    const validPassword = await bcrypt.compare(plainPassword, hashedPassword);
    return validPassword;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

module.exports.parseTokenExpiryTime = (tokenExpiryTime) => {
  const unit = tokenExpiryTime.slice(-1);
  const value = parseInt(tokenExpiryTime.slice(0, -1));

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      throw new Error("Invalid token expiry time unit");
  }
};

module.exports.generateAlphaNumericPassword = (length = 6) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return password;
};

module.exports.generateNumericPassword = (length = 4) => {
  const digits = "0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return password;
};
