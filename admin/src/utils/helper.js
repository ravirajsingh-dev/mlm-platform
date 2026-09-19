import { jwtDecode } from "jwt-decode";

export const capitalizeFirst = (text) => {
  if (!text) return "";
  const [first, ...rest] = text;
  return first.toUpperCase() + rest.join("");
};

export const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      times.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return times;
};

export const capitalizeFirstLetterOfEachWord = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const capitalizeAll = (text) => {
  if (!text) return "";
  return text
    .split("")
    .map((char) => char.toUpperCase())
    .join("");
};

export const isAdmin = (user) => {
  return user && user.role === 2 ? true : false;
};

export const goBack = (navigate) => {
  try {
    navigate(-1);
  } catch (err) {
    console.log("Nevigation error", err);
    navigate("/");
  }
};

export const decodeToken = (token) => {
  if (typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("Invalid token specified: missing part #2");
  }
  return jwtDecode(token);
};

export const handleTableChange = (
  type,
  searchText,
  sortingParams,
  setUserParams,
  searchFields
) => {
  const { limit, page } = sortingParams;
  let params = {
    limit: limit,
    page: type === "search" ? 1 : page ? page : 1,
  };

  let filters = [];
  if (type === "search") {
    if (searchText.length > 0) {
      filters = sortingParams.filters.includes(type)
        ? sortingParams.filters
        : [...sortingParams.filters, type];

      const query = searchFields.reduce((acc, field) => {
        acc[field.name] = { value: searchText, type: field.type };
        return acc;
      }, {});

      params = {
        ...params,
        query: {
          ...sortingParams.query,
          [type]: query,
        },
        filters,
      };
    } else {
      filters = sortingParams.filters.filter((item) => item !== type);
      const temp = {};
      params = {
        ...sortingParams,
        filters,
      };
      for (const key in params.query) {
        if (key === type) continue;
        temp[key] = params.query[key];
      }
      params.query = temp;
    }
  }

  setUserParams(params);
};

export const handleNumberInput = (event) => {
  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight"];

  if (!/[0-9]/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
};

export const formatIndianNumber = (number) => {
  if (number == null) return "0"; // or return "0" or any other default value you prefer

  // Round to 2 decimal places
  const roundedNumber = Math.round(parseFloat(number) * 100) / 100;

  const [integerPart, decimalPart] = roundedNumber.toString().split(".");

  const lastThreeDigits = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);

  const formattedNumber =
    otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
    (otherDigits ? "," : "") +
    lastThreeDigits;

  // Always show 2 decimal places if there was a decimal part, otherwise no decimals
  if (decimalPart !== undefined) {
    const formattedDecimal = decimalPart.padEnd(2, "0").slice(0, 2);
    return formattedNumber + "." + formattedDecimal;
  }

  return formattedNumber;
};
