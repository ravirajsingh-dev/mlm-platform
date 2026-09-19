import { createBrowserRouter } from "react-router-dom";

// Layouts
import PublicLayout from "../Layout/PublicLayout";
import PortalLayout from "../Layout/PortalLayout";

// Auth Components
import Register from "../Auth/Register";
import Login from "../Auth/Login";

// Public Components
import Home from "../Layout/Home/Home";

// Dashboard Component
import Dashboard from "../Layout/Dashboard/Dashboard";

// Profile Components
import Profile from "../Layout/Profile/Profile";

// Password Components
import ChangePassword from "../Layout/Passwords/ChangePassword";
import SetTransactionPassword from "../Layout/Passwords/SetTransactionPassword";
import ChangeTransactionPassword from "../Layout/Passwords/ChangeTransactionPassword";
import TransactionPasswordIndex from "../Layout/Passwords/TransactionPasswordIndex";

// Wallet Components
import CreateWallet from "../Layout/Wallet/CreateWallet";
import WalletLayout from "../Layout/Wallet/WalletLayout";
import MoneyTransferForm from "../Layout/Wallet/MoneyTransferForm";
import WithdrawalRequestForm from "../Layout/Wallet/WithdrawalRequestForm";
import WithdrawalHistory from "../Layout/Wallet/WithdrawalHistory";

// Team Components
import MyTeamList from "../Layout/Team/MyTeam/MyTeamList";
import LevelWiseTeam from "../Layout/Team/LevelwiseTeam/LevelWiseTeam";
import ShowLevelWiseUsers from "../Layout/Team/LevelwiseTeam/ShowLevelWiseUsers";
import TeamStructure from "../Layout/Team/TeamStructure/TeamStructure";

// Help Links Components
import SendPaymentList from "../Layout/HelpLinks/SendPaymentList";
import ReceivePaymentList from "../Layout/HelpLinks/ReceivePaymentList";
import DownlinePendingLinks from "../Layout/HelpLinks/DownlinePendingLinks";

// EPins Components
import EPinsList from "../Layout/EPins/EPinsList";
import TransferEpin from "../Layout/EPins/TransferEpin";
import EPinTransferReportsList from "../Layout/EPins/EPinTransferReportsList";

// Upgrade Components
import UpgrageLevel from "../Layout/Upgrades/UpgrageLevel";

// Common Components
import NotFoundPage from "../Common/NotFound/NotFoundPage";
import DirectUsersList from "../Layout/Team/DirectUsers/DirectUsersList";

// Mobile Views
import SettingsLayout from "../Layout/MobileLayout/SettingsLayout";
import WalletsLayout from "../Layout/MobileLayout/WalletsLayout";
import HelplinksLayout from "../Layout/MobileLayout/HelplinksLayout";
import TeamsLayout from "../Layout/MobileLayout/TeamsLayout";
import EpinsLayout from "../Layout/MobileLayout/EpinsLayout";
import SevaKendrasList from "../Layout/SevaKendra/SevaKendrasList";
import MyLegList from "../Layout/Team/MyTeam/MyLegList";
import EPoolTransferForm from "../Layout/Wallet/EPoolTransferForm";
import WithdrawalLayout from "../Layout/Wallet/WithdrawalLayout";

const PortalRoutes = createBrowserRouter([
  // Public Routes (Unauthenticated)
  {
    path: "/register",
    name: "Register",
    element: <Register />,
  },
  {
    path: "/login",
    name: "Login",
    element: <Login />,
  },
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        name: "Home Page",
        element: <Home />,
      },
      // {
      //   path: "/contact-us",
      //   name: "Contact US",
      //   element: <ContactUs />,
      // },
      // {
      //   path: "/about-us",
      //   name: "About US",
      //   element: <AboutUs />,
      // },
      // {
      //   path: "/forgot-password",
      //   name: "Forgot Password",
      //   element: <ForgotPassword />,
      // },
    ],
  },

  // Authenticated Routes (Protected by PortalLayout)
  {
    path: "/user",
    element: <PortalLayout />,
    children: [
      // Dashboard
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      // Mobile View
      {
        path: "settings-layout",
        element: <SettingsLayout />,
      },
      {
        path: "wallet-layout",
        element: <WalletsLayout />,
      },
      {
        path: "helplink-layout",
        element: <HelplinksLayout />,
      },
      {
        path: "teams-layout",
        element: <TeamsLayout />,
      },
      {
        path: "epins-layout",
        element: <EpinsLayout />,
      },

      // Profile Section
      {
        path: "profile",
        element: <Profile />,
      },

      // Password Management Section
      {
        path: "change-login-password",
        element: <ChangePassword />,
      },
      {
        path: "set-transaction-password",
        element: <SetTransactionPassword />,
      },
      {
        path: "change-transaction-password",
        element: <ChangeTransactionPassword />,
      },
      {
        path: "transaction-password",
        element: <TransactionPasswordIndex />,
      },

      // Team Section
      {
        path: "all-team",
        element: <MyTeamList />,
      },
      {
        path: "team/:position",
        element: <MyLegList />,
      },
      {
        path: "direct-team",
        element: <DirectUsersList />,
      },
      {
        path: "level-wise-team",
        element: <LevelWiseTeam />,
      },
      {
        path: "level-wise-team/:level",
        element: <ShowLevelWiseUsers />,
      },
      {
        path: "team-structure",
        element: <TeamStructure />,
      },

      // Help Links Section
      {
        path: "help-links/send-payments",
        element: <SendPaymentList />,
      },
      {
        path: "help-links/receive-payments",
        element: <ReceivePaymentList />,
      },
      {
        path: "help-links/pending-links",
        element: <DownlinePendingLinks />,
      },

      // EPins Section
      {
        path: "e-pins",
        element: <EPinsList />,
      },

      {
        path: "epins/transfer",
        element: <TransferEpin />,
      },
      {
        path: "epins/transfer-reports",
        element: <EPinTransferReportsList />,
      },

      // Wallet Section
      {
        path: "transfer-e-pool",
        element: <EPoolTransferForm />,
      },
      {
        path: "transfer-e-cash",
        element: <MoneyTransferForm />,
      },
      {
        path: "wallet-transfer",
        element: <CreateWallet />,
      },
      {
        path: "wallet",
        element: <WalletLayout />,
      },
      {
        path: "withdraw-e-cash",
        element: <WithdrawalRequestForm />,
      },
      {
        path: "withdrawal-history",
        element: <WithdrawalHistory />,
      },
      {
        path: "withdrawal-layout",
        element: <WithdrawalLayout />,
      },

      // Upgrade Section
      {
        path: "upgrade",
        element: <UpgrageLevel />,
      },

      // Seva Kendra Section
      {
        path: "seva-kendra",
        element: <SevaKendrasList />,
      },

      // 404 Page
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default PortalRoutes;
