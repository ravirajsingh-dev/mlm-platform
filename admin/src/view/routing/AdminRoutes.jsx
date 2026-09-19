import AdminDashboard from "@src/view/admin/components/AdminDashboard";

// Admin Default Constent Values Section
import AdminWithdrawalDefaultValues from "@src/view/admin/components/adminDefaultValues/AdminWithdrawalDefaultValues";

// Application Settings
import ApplicationSettings from "@src/view/admin/components/ApplicationSettings/ApplicationSettings";

// Users Section
import UsersList from "@src/view/admin/components/users/UsersList";
import InactiveUsersList from "@src/view/admin/components/users/InactiveUsersList";
import UserEditLayout from "@src/view/admin/components/users/UserEditLayout";

// All Transaction Requests Section
import AllWithdrawalRequests from "@src/view/admin/components/transactionRequests/withdrawals/AllWithdrawalRequests";
import EditWithdrawalRequest from "@src/view/admin/components/transactionRequests/withdrawals/EditWithdrawalRequest";

// EPin Section
import EPinsList from "../admin/components/epins/EPinsList";
import CreateEpin from "../admin/components/epins/CreateEpin";
import EPinTransferReportsList from "../admin/components/epins/EPinTransferReportsList";

import ReceivePaymentList from "../admin/components/HelpLinks/ReceivePaymentList";
import DownlinePendingLinks from "../admin/components/HelpLinks/DownlinePendingLinks";

// First-Pay User
import FirstPayUserList from "../admin/components/FirstPayUser/FirstPayUserList";
import CreateFirstPayUser from "../admin/components/FirstPayUser/CreateFirstPayUser";

// Wallet
import MoneyTransferReportsList from "../admin/components/Wallet/MoneyTransferReportsList";
import CreateWallet from "../admin/components/Wallet/CreateWallet";
import WalletDetails from "../admin/components/Wallet/WalletDetails";
import ECashBalance from "../admin/components/Wallet/ECashBalance";
import TransferReport from "../admin/components/Wallet/TransferReport";
import SevaKendraList from "../admin/components/SevaKendra/SevaKendraList";
import CreateSevaKendra from "../admin/components/SevaKendra/CreateSevaKendra";

// Media Management
import SliderList from "../admin/components/Slider/SliderList";
import GalleryList from "../admin/components/Gallery/GalleryList";

// Donation Management
import DonationButtonsList from "../admin/components/Donation/DonationButtonsList";
import DonationRequestsList from "../admin/components/Donation/DonationRequestsList";

const AdminRoutes = [
  {
    path: "/dashboard",
    name: "Admin Dashboard",
    element: <AdminDashboard />,
  },

  // Admin Default Constent Values Section
  {
    path: "/default-values/withdrawal",
    name: "Admin Withdrawal Default Values",
    element: <AdminWithdrawalDefaultValues />,
  },

  // Application Settings
  {
    path: "/application-settings",
    name: "Application Settings",
    element: <ApplicationSettings />,
  },

  // E-Wallet Section
  {
    path: "/e-wallet/manage",
    name: "Manage Wallets",
    element: <MoneyTransferReportsList />,
  },
  {
    path: "/e-wallet/details",
    name: "Wallet Details",
    element: <WalletDetails />,
  },
  {
    path: "/e-wallet/e-cash-balance",
    name: "E-Cash Balance",
    element: <ECashBalance />,
  },
  {
    path: "/e-wallet/transfer-report",
    name: "Transfer Report",
    element: <TransferReport />,
  },
  {
    path: "/transfer-fund",
    name: "Transfer Money",
    element: <CreateWallet />,
  },

  // EPins
  {
    path: "/e-pins",
    name: "EPin",
    element: <EPinsList />,
  },

  {
    path: "/e-pins/transfer-reports",
    name: "Transfer Reports",
    element: <EPinTransferReportsList />,
  },

  {
    path: "/epins/create",
    name: "Create EPin",
    element: <CreateEpin />,
  },

  // First-Pay User
  {
    path: "/first-pay-user",
    name: "First-Pay User",
    element: <FirstPayUserList />,
  },
  {
    path: "/first-pay-user/create",
    name: "Create First-Pay User",
    element: <CreateFirstPayUser />,
  },

  // First-Pay User
  {
    path: "/seva-kendra",
    name: "Seva Kendra List",
    element: <SevaKendraList />,
  },
  {
    path: "/seva-kendra/create",
    name: "Create First-Pay User",
    element: <CreateSevaKendra />,
  },

  // Users Section
  {
    path: "/users-list",
    name: "Users List",
    element: <UsersList />,
  },
  {
    path: "/inactive-users-list",
    name: "Inactive Users",
    element: <InactiveUsersList />,
  },
  {
    path: "/users/edit/:user_id/*",
    name: "Users All Details",
    element: <UserEditLayout />,
  },

  // All Transaction Requests Section
  {
    path: "/users/withdrawal-requests/list",
    name: "Withdrawal Requests List",
    element: <AllWithdrawalRequests />,
  },
  {
    path: "/withdrawals/view/:withdrawal_id",
    name: "Edit Withdrawal Requests",
    element: <EditWithdrawalRequest />,
  },

  {
    path: "/help-links/accept/list",
    name: "Receiver Accept List",
    element: <ReceivePaymentList />,
  },
  {
    path: "help-links/pending-links",
    element: <DownlinePendingLinks />,
  },

  // Media Management
  {
    path: "/slider",
    name: "Slider Banners",
    element: <SliderList />,
  },
  {
    path: "/gallery",
    name: "Image Gallery",
    element: <GalleryList />,
  },

  // Donation Management
  {
    path: "/donation/buttons",
    name: "Donation Buttons",
    element: <DonationButtonsList />,
  },
  {
    path: "/donation/requests",
    name: "Donation Requests",
    element: <DonationRequestsList />,
  },
];

export default AdminRoutes;
