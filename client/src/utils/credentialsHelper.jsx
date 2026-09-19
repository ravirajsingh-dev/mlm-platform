import CryptoJS from "crypto-js";

export const encryptCredentials = (identifier, password) => {
  const secretKey = "dasd4541ASD4dsa546fggPDFofdf54d5saD";
  const encryptedIdentifier = CryptoJS.AES.encrypt(
    identifier,
    secretKey
  ).toString();
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    secretKey
  ).toString();

  // Set expiry for 15 days
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 15);

  sessionStorage.setItem("rememberedIdentifier", encryptedIdentifier);
  sessionStorage.setItem("rememberedPassword", encryptedPassword);
  sessionStorage.setItem("credentialsExpiry", expiryDate.getTime().toString());
};

// Function to decrypt the user's credentials
export const decryptCredentials = () => {
  const secretKey = "dasd4541ASD4dsa546fggPDFofdf54d5saD";

  const encryptedIdentifier = sessionStorage.getItem("rememberedIdentifier");
  const encryptedPassword = sessionStorage.getItem("rememberedPassword");
  const credentialsExpiry = sessionStorage.getItem("credentialsExpiry");
  const loginType = sessionStorage.getItem("loginType");

  if (
    encryptedIdentifier &&
    encryptedPassword &&
    credentialsExpiry &&
    loginType
  ) {
    const expiryDate = parseInt(credentialsExpiry);
    if (expiryDate >= Date.now()) {
      const decryptedIdentifier = CryptoJS.AES.decrypt(
        encryptedIdentifier,
        secretKey
      ).toString(CryptoJS.enc.Utf8);
      const decryptedPassword = CryptoJS.AES.decrypt(
        encryptedPassword,
        secretKey
      ).toString(CryptoJS.enc.Utf8);
      return {
        identifier: decryptedIdentifier,
        password: decryptedPassword,
        loginType,
      };
    }
  }

  return { identifier: "", password: "" };
};

export const clearCredentials = () => {
  sessionStorage.removeItem("rememberedIdentifier");
  sessionStorage.removeItem("rememberedPassword");
  sessionStorage.removeItem("credentialsExpiry");
  sessionStorage.removeItem("loginType");
};

export const rememberUserCredentials = (formData, loginType) => {
  if (formData.rememberPassword) {
    const identifier = formData.EP_ID;
    encryptCredentials(identifier, formData.password);
    sessionStorage.setItem("loginType", loginType);
  } else {
    clearCredentials();
  }
};

// localStorage helper functions for saving user credentials
export const saveUserCredentials = (EP_ID, password) => {
  try {
    localStorage.setItem("savedEP_ID", EP_ID);
    localStorage.setItem("savedPassword", password);
    localStorage.setItem("rememberPassword", "true");
  } catch (error) {
    console.error("Error saving credentials to localStorage:", error);
  }
};

export const getUserCredentials = () => {
  try {
    const EP_ID = localStorage.getItem("savedEP_ID");
    const password = localStorage.getItem("savedPassword");
    const rememberPassword =
      localStorage.getItem("rememberPassword") === "true";

    return {
      EP_ID: EP_ID || "",
      password: password || "",
      rememberPassword,
    };
  } catch (error) {
    console.error("Error getting credentials from localStorage:", error);
    return {
      EP_ID: "",
      password: "",
      rememberPassword: false,
    };
  }
};

export const removeUserCredentials = () => {
  try {
    localStorage.removeItem("savedEP_ID");
    localStorage.removeItem("savedPassword");
    localStorage.removeItem("rememberPassword");
  } catch (error) {
    console.error("Error removing credentials from localStorage:", error);
  }
};
