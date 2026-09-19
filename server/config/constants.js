const tokenExpiryTime = "1h";
const refreshTokenExpiryTime = "15m";

const excludedPaths = [
  "/api/auth/users",
  "/api/auth",
  "/api/users/help-links",
  "/api/common/settings",
  "/api/common/slider-banners",
  "/api/common/gallery",
  "/api/common/seva-kendra",
  "/api/common/admin/details",
  "/api/common/user",
  "/api/common/donation",
];

module.exports = { tokenExpiryTime, refreshTokenExpiryTime, excludedPaths };
