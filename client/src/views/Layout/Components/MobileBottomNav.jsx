import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaWallet, FaCog, FaLink } from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";

const MobileBottomNav = ({ isAuthenticated }) => {
  const location = useLocation();

  const navItems = [
    { path: "/user/dashboard", label: "Home", icon: FaHome },
    { path: "/user/wallet-layout", label: "Wallet", icon: FaWallet },
    { path: "/user/helplink-layout", label: "EP Links", icon: FaLink },
    { path: "/user/teams-layout", label: "Teams", icon: RiTeamFill },
    { path: "/user/settings-layout", label: "Settings", icon: FaCog },
  ];

  return (
    <>
      {isAuthenticated && (
        <nav className="mobile-bottom-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
};

export default MobileBottomNav;
