import React from "react";
import Wallet from "./Wallet";
import WalletTxns from "./WalletTxns";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";

const WalletLayout = () => {
  return (
    <>
      <AppBreadCrumb
        title="Wallet Overview"
        breadcrumbs={[
          { label: "Dashboard", link: "/user/dashboard" },
          { label: "Wallet" },
        ]}
      />

      <Wallet />
      <WalletTxns />
    </>
  );
};

export default WalletLayout;
