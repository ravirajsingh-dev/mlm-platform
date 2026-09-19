const PortalItems = [
  {
    label: "Dashboard",
    path: "/user/dashboard",
    isAuth: true,
  },

  {
    label: "Team",
    isAuth: true,
    children: [
      {
        label: "My Team",
        path: "/user/all-team",
      },
      {
        label: "Direct Team",
        path: "/user/direct-team",
      },
      {
        label: "Level-wise Team",
        path: "/user/level-wise-team",
      },
      {
        label: "Structure",
        path: "/user/team-structure",
      },
    ],
  },

  {
    label: "EP-Keys",
    isAuth: true,
    children: [
      {
        label: "EP-Keys List",
        path: "/user/e-pins",
      },

      {
        label: "Transfer Reports",
        path: "/user/epins/transfer-reports",
      },
    ],
  },

  {
    label: "Wallet",
    isAuth: true,
    children: [
      {
        label: "Transfer E-Cash",
        path: "/user/wallet-transfer",
      },
      {
        label: "Withdrawal",
        path: "/user/withdrawal-layout",
      },
      {
        label: "Wallet",
        path: "/user/wallet",
      },
    ],
  },

  {
    label: "EP Links",
    isAuth: true,
    children: [
      // {
      //   label: "Downline Pending Links",
      //   path: "/user/help-links/pending-links",
      // },

      {
        label: "Sending Links",
        path: "/user/help-links/send-payments",
      },
      {
        label: "Receiving Links",
        path: "/user/help-links/receive-payments",
      },
    ],
  },
  {
    label: "Upgrade",
    path: "/user/upgrade",
    isAuth: true,
  },

  {
    label: "User",
    isAuth: true,
    children: [
      {
        label: "Profile",
        path: "/user/profile",
      },
      // {
      //   label: "Credentials",
      //   path: "/user/credentials",
      // },
      {
        label: "Login Password",
        path: "/user/change-login-password",
      },
      {
        label: "Txn Password",
        path: "/user/transaction-password",
      },
    ],
  },
];

export default PortalItems;
