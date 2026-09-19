import {
  TbLayoutDashboard,
  TbDeviceGamepad2,
  TbSettings,
  TbPhoto,
  TbSlideshow,
  TbHeartHandshake,
  TbUserOff,
} from "react-icons/tb";
import { SiDatabricks } from "react-icons/si";
import { FaRegUser } from "react-icons/fa";

import { PiBank } from "react-icons/pi";

const AdminSidebarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    heading: "Dashboard",
    path: "/admin/dashboard",
    icon: <TbLayoutDashboard size={18} />,
  },
  {
    key: "e-wallet",
    label: "E-Wallet",
    heading: "E-Wallet",
    icon: <SiDatabricks size={18} />,
    children: [
      {
        key: "manage-wallets",
        label: "Manage Wallets",
        heading: "Manage Wallets",
        path: "/admin/e-wallet/manage",
        icon: <TbDeviceGamepad2 size={18} />,
      },
      {
        key: "wallet-details",
        label: "Wallet Details",
        heading: "Wallet Details",
        path: "/admin/e-wallet/details",
        icon: <TbDeviceGamepad2 size={18} />,
      },
      {
        key: "e-cash-balance",
        label: "E-Cash Balance",
        heading: "E-Cash Balance",
        path: "/admin/e-wallet/e-cash-balance",
        icon: <TbDeviceGamepad2 size={18} />,
      },
      {
        key: "transfer-report",
        label: "Transfer Report",
        heading: "Transfer Report",
        path: "/admin/e-wallet/transfer-report",
        icon: <TbDeviceGamepad2 size={18} />,
      },
    ],
  },

  {
    key: "epins",
    label: "E Pin",
    heading: "E Pin",
    icon: <SiDatabricks size={18} />,
    children: [
      {
        key: "child-default-epin",
        label: "EP-Keys List",
        path: "/admin/e-pins",
        heading: "EP-Keys List",
        icon: <TbDeviceGamepad2 size={18} />,
      },
      {
        key: "admin-e-pins-transfer-report",
        label: "Transfer Reports",
        heading: "Transfer Reports",
        path: "/admin/e-pins/transfer-reports",
        icon: <TbDeviceGamepad2 size={18} />,
      },
    ],
  },

  {
    key: "admin-first-pay-user",
    label: "First-Pay User",
    heading: "First-Pay User",
    icon: <PiBank size={18} />,
    path: "/admin/first-pay-user",
  },

  {
    key: "admin-seva-kendra",
    label: "Seva Kendra",
    heading: "Seva Kendra",
    icon: <PiBank size={18} />,
    path: "/admin/seva-kendra",
  },

  {
    key: "users-list",
    label: "Users List",
    heading: "Users List",
    path: "/admin/users-list",
    icon: <FaRegUser size={18} />,
  },

  {
    key: "inactive-users-list",
    label: "Inactive Users",
    heading: "Inactive Users",
    path: "/admin/inactive-users-list",
    icon: <TbUserOff size={18} />,
  },

  {
    key: "withdrawal-requests",
    label: "Withdrawal Requests",
    heading: "Withdrawal Requests",
    path: "/admin/users/withdrawal-requests/list",
    icon: <PiBank size={18} />,
  },

  {
    key: "donations",
    label: "Donations",
    heading: "Donations",
    icon: <TbHeartHandshake size={18} />,
    children: [
      {
        key: "donation-buttons",
        label: "Donation Buttons",
        heading: "Donation Buttons",
        path: "/admin/donation/buttons",
        icon: <TbDeviceGamepad2 size={18} />,
      },
      {
        key: "donation-requests",
        label: "Donation Requests",
        heading: "Donation Requests",
        path: "/admin/donation/requests",
        icon: <TbDeviceGamepad2 size={18} />,
      },
    ],
  },

  {
    key: "application-settings",
    label: "Application Settings",
    heading: "Application Settings",
    path: "/admin/application-settings",
    icon: <TbSettings size={18} />,
  },

  {
    key: "media-management",
    label: "Media Management",
    heading: "Media Management",
    icon: <TbPhoto size={18} />,
    children: [
      {
        key: "slider-banners",
        label: "Slider Banners",
        heading: "Slider Banners",
        path: "/admin/slider",
        icon: <TbSlideshow size={18} />,
      },
      {
        key: "image-gallery",
        label: "Image Gallery",
        heading: "Image Gallery",
        path: "/admin/gallery",
        icon: <TbPhoto size={18} />,
      },
    ],
  },
];
export default AdminSidebarItems;
