import React from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaWallet, FaArrowDown, FaArrowUp } from "react-icons/fa";
import { fetchCurrentBalance, entryToEPool } from "@src/actions/walletActions";
import LoadingSkeleton from "@src/views/Common/Loaders/LoadingSkeleton";
import ConfirmModal from "@src/views/Common/Modal/ConfirmModal";
import {
  normalizeWalletType,
  normalizeTransactionType,
} from "@src/utils/walletFilterConstants";

const Wallet = ({
  loggedInUser,
  currentTxnDetails,
  loadingCurrentBalance,
  fetchCurrentBalance,
  entryToEPool,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showEPoolModal, setShowEPoolModal] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!loggedInUser) return;
    fetchCurrentBalance(loggedInUser._id);
  }, [fetchCurrentBalance, loggedInUser]);

  // Redirect if transaction password isn't set
  if (loggedInUser?.isTxnPassSet === false) {
    return <Navigate to="/user/transaction-password" replace />;
  }

  const statsData = [
    {
      label: "Total Balance",
      value: currentTxnDetails?.totalBalance,
      desc: "Available balance in your wallet.",
      icon: <FaWallet />,
    },
    {
      label: "E-Cash",
      value: currentTxnDetails?.e_cash,
      desc: "Available balance in your wallet.",
      icon: <FaWallet />,
      walletType: "e_cash",
      filterType: "walletType",
    },
    {
      label: "Upgrade",
      value: currentTxnDetails?.upgrade,
      desc: "Available balance in your wallet.",
      icon: <FaWallet />,
      walletType: "upgrade",
      filterType: "walletType",
    },
    {
      label: "E-Pool",
      value: currentTxnDetails?.e_pool,
      desc: "Available balance in your E-Pool wallet.",
      icon: <FaWallet />,
      walletType: "e_pool",
      filterType: "walletType",
    },
    {
      label: "E-Pool Upgrade",
      value: currentTxnDetails?.e_pool_upgrade,
      desc: "Available balance in your E-Pool Upgrade wallet.",
      icon: <FaWallet />,
      walletType: "e_pool_upgrade",
      filterType: "walletType",
    },
    {
      label: "Total Credit",
      value: currentTxnDetails?.creditedAmount,
      desc: "Total funds added to your wallet.",
      icon: <FaArrowDown />,
      transactionType: "credit",
      filterType: "type",
    },
    {
      label: "Total Debit",
      value: currentTxnDetails?.debitedAmount,
      desc: "Total funds spent from your wallet.",
      icon: <FaArrowUp />,
      transactionType: "debit",
      filterType: "type",
    },
  ];

  const handleCardClick = React.useCallback(
    (item) => {
      if (!item || (!item.walletType && !item.transactionType)) return;

      // Preserve existing URL params (for modal filters like min/max/description/dates)
      // Only walletType and type are managed via URL for card-based filtering
      const searchParams = new URLSearchParams(location.search);

      if (item.filterType === "walletType" && item.walletType) {
        const normalizedWalletType = normalizeWalletType(item.walletType);
        if (normalizedWalletType) {
          searchParams.set("walletType", normalizedWalletType);
          // Clear type filter when setting walletType (card filters are mutually exclusive per card)
          searchParams.delete("type");
        } else {
          return; // Invalid wallet type
        }
      } else if (item.filterType === "type" && item.transactionType) {
        const normalizedType = normalizeTransactionType(item.transactionType);
        if (normalizedType) {
          searchParams.set("type", normalizedType);
          // Clear walletType filter when setting type (card filters are mutually exclusive per card)
          searchParams.delete("walletType");
        } else {
          return; // Invalid transaction type
        }
      } else {
        return;
      }

      navigate(`${location.pathname}?${searchParams.toString()}`, {
        replace: true,
      });
    },
    [location.pathname, location.search, navigate]
  );

  const handleEPoolEntry = () => {
    setShowEPoolModal(true);
  };

  const handleConfirmEPoolEntry = async () => {
    if (!loggedInUser) return;

    setIsProcessing(true);
    try {
      const result = await entryToEPool(loggedInUser._id);
      if (result.status) {
        setShowEPoolModal(false);
        // Balance will be refreshed automatically by the action
      }
    } catch (error) {
      // Error handling is done by the action/reducer
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseEPoolModal = () => {
    if (!isProcessing) {
      setShowEPoolModal(false);
    }
  };

  return (
    <>
      <Card className="stats-container mb-4">
        <Row className="g-2">
          {statsData.map((item, index) => (
            <Col key={index} xs={6} md={3}>
              <div
                className="stat-card"
                role={
                  item.walletType || item.transactionType ? "button" : undefined
                }
                tabIndex={
                  item.walletType || item.transactionType ? 0 : undefined
                }
                onClick={() =>
                  (item.walletType || item.transactionType) &&
                  handleCardClick(item)
                }
                onKeyDown={(e) =>
                  (item.walletType || item.transactionType) &&
                  (e.key === "Enter" || e.key === " ") &&
                  handleCardClick(item)
                }
                style={{
                  cursor:
                    item.walletType || item.transactionType
                      ? "pointer"
                      : "default",
                }}
                title={
                  item.walletType || item.transactionType
                    ? `Click to filter by ${item.label}`
                    : item.label
                }
              >
                <div className="stat-value">
                  {loadingCurrentBalance ? (
                    <LoadingSkeleton count={1} />
                  ) : (
                    <>₹{item.value ?? "0"}</>
                  )}
                </div>
                <div className="stat-label">{item.label}</div>
              </div>
            </Col>
          ))}
        </Row>
        {!loggedInUser?.is_root && (
          <Row className="mt-3">
            <Col className="text-center">
              {loggedInUser?.has_entered_e_pool ? (
                <div className="alert alert-dark">
                  <h3 className="maroon-color">Already entered in E-Pool</h3>
                  <p className="mb-0 mt-2 maroon-color">
                    You have already entered the E-Pool. Entry is allowed only
                    once.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    className="blinking-button"
                    onClick={handleEPoolEntry}
                    disabled={
                      loadingCurrentBalance ||
                      isProcessing ||
                      (currentTxnDetails?.e_cash || 0) < 500
                    }
                  >
                    {isProcessing ? "Processing..." : "Entry in E-Pool"}
                  </Button>
                  {(currentTxnDetails?.e_cash || 0) < 500 && (
                    <p className="text-muted mt-2 small">
                      Minimum ₹500 required in E-Cash to enter E-Pool
                    </p>
                  )}
                </>
              )}
            </Col>
          </Row>
        )}
      </Card>

      <ConfirmModal
        show={showEPoolModal}
        handleClose={handleCloseEPoolModal}
        handleConfirm={handleConfirmEPoolEntry}
        title="Confirm E-Pool Entry"
        body="Are you sure you want to enter E-Pool? This will debit ₹500 from your E-Cash wallet and credit it to your E-Pool Upgrade wallet."
        submitBtnText={isProcessing ? "Processing..." : "Yes"}
        cancelBtnText="No"
      />
    </>
  );
};

Wallet.propTypes = {
  loggedInUser: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  currentTxnDetails: state.wallet.currentTxnDetails,
  loadingCurrentBalance: state.wallet.loadingCurrentBalance,
});

export default connect(mapStateToProps, { fetchCurrentBalance, entryToEPool })(
  Wallet
);
