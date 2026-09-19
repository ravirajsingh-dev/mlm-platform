export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [
  {
    text: "10",
    page: 10,
  },
  {
    text: "20",
    page: 20,
  },
  {
    text: "50",
    page: 50,
  },
  {
    text: "100",
    page: 100,
  },
  {
    text: "200",
    page: 200,
  },
];

export const credentialTypes = [
  {
    label: "Bank",
    value: "bank",
  },
  {
    label: "UPI ID",
    value: "upi",
  },
];

export const ePinTypes = [
  {
    label: "EPin",
    value: "epin",
  },
];

export const UserStatuses = [
  {
    label: "Active",
    value: 1,
  },
  {
    label: "Inactive",
    value: 2,
  },
  {
    label: "New",
    value: 3,
  },
  {
    label: "Temporary Blocked",
    value: 4,
  },
];

export const donationBtn = [50, 100, 200, 500, 1000];

export const baseURL = "http://localhost:5000";
