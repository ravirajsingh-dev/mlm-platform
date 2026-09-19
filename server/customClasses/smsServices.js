const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.SMS_BASE_URL || "https://sms.example.com";
const AUTH_KEY = process.env.SMS_AUTH_KEY;
const SENDER_ID = process.env.SMS_SENDER_ID || "EXAMPLE";
const ROUTE = process.env.SMS_ROUTE_ID || 1;

const requireSmsAuth = () => {
  if (!AUTH_KEY) {
    throw new Error("SMS_AUTH_KEY is not set");
  }
};

const sendSingleSMS = async ({ phone, message, templateId }) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-tokenkeyapi.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    senderid: SENDER_ID,
    route: ROUTE,
    number: phone,
    message,
    templateid: templateId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const sendBulkSMS = async ({ numbers, message, templateId }) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-tokenkeyapi.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    senderid: SENDER_ID,
    route: ROUTE,
    number: numbers.join(","),
    message,
    templateid: templateId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const sendUnicodeSMS = async ({ phone, message, templateId }) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-tokenkeyapi.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    senderid: SENDER_ID,
    route: ROUTE,
    unicode: 2,
    number: phone,
    message,
    templateid: templateId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const sendScheduledSMS = async ({ numbers, message, templateId, time }) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-tokenkeyapi.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    senderid: SENDER_ID,
    route: ROUTE,
    number: numbers.join(","),
    message,
    time,
    templateid: templateId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const sendCustomizedSMS = async ({ numbers, messages, templateId }) => {
  requireSmsAuth();
  const url = `${BASE_URL}/customizesms.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    senderid: SENDER_ID,
    route: ROUTE,
    number: numbers.join(","),
    message: messages.join("^"),
    templateid: templateId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const getDeliveryReport = async (msgId) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-dlr.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    msg_id: msgId,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

const checkBalance = async (routeId) => {
  requireSmsAuth();
  const url = `${BASE_URL}/http-credit.php`;
  const params = {
    "authentic-key": AUTH_KEY,
    route_id: routeId || ROUTE,
  };
  const response = await axios.get(url, { params });
  return response.data;
};

module.exports = {
  sendSingleSMS,
  sendBulkSMS,
  sendUnicodeSMS,
  sendScheduledSMS,
  sendCustomizedSMS,
  getDeliveryReport,
  checkBalance,
};
