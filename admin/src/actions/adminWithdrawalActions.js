import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";
import {
  withdrawalRequestListUpdated,
  withdrawalRequestError,
  withdrawalRequestDetailsById,
  loadingWithdrawalRequestsList,
  loadingOnWithdrawalRequestSubmit,
  withdrawalRequestSearchParameterUpdate,
  resetWithdrawalRequest,
  withdrawalRequestApproved,
  withdrawalRequestRejected,
} from "@reducers/adminWithdrawalsReducer";

export const getAllWithdrawalRequests =
  (withdrawalParams) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Map old params to new API format
      let status = withdrawalParams.status;
      if (!status && withdrawalParams.filters) {
        const statusFilter = withdrawalParams.filters.find(
          (f) => f.field === "status"
        );
        status = statusFilter?.value;
      }
      
      const page = withdrawalParams.page || 1;
      const limit = withdrawalParams.limit || 10;
      const epId = withdrawalParams.epId || null;

      const params = {
        page,
        limit,
      };
      
      // Only add status if it's a valid value
      if (status && typeof status === 'string') {
        const upperStatus = status.toUpperCase();
        if (["PENDING", "APPROVED", "REJECTED"].includes(upperStatus)) {
          params.status = upperStatus;
        }
      }

      // Add EP ID filter if provided
      if (epId && epId.trim()) {
        params.epId = epId.trim();
      }

      config.params = params;

      dispatch(loadingWithdrawalRequestsList());

      const res = await api.get(`/api/admin/withdrawal/requests`, config);

      if (res.data && res.data.status === true && res.data.response) {
        // Transform response to match expected format
        const transformedResponse = {
          data: res.data.response.requests || [],
          metadata: [
            {
              current_page: res.data.response.pagination?.currentPage || page,
              totalRecord: res.data.response.pagination?.totalRecords || 0,
            },
          ],
        };

        dispatch(withdrawalRequestSearchParameterUpdate(withdrawalParams));
        dispatch(withdrawalRequestListUpdated(transformedResponse));
      } else {
        // No data or error response
        dispatch(withdrawalRequestListUpdated({
          data: [],
          metadata: [{ current_page: page, totalRecord: 0 }],
        }));
      }
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        // Only show error if it's a real error, not just empty results
        if (err.response && err.response.status !== 200) {
          err.response &&
            dispatch(
              withdrawalRequestError({
                msg: err.response.statusText,
                status: err.response.status,
              })
            );
          dispatch(setAlert(err.response?.data?.message || err.response?.message || "Error fetching withdrawal requests", "danger"));
        } else {
          // Empty results - not an error
          dispatch(withdrawalRequestListUpdated({
            data: [],
            metadata: [{ current_page: withdrawalParams.page || 1, totalRecord: 0 }],
          }));
        }
      }
    }
  };

export const getWithdrawalRequestById = (withdrawal_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnWithdrawalRequestSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    
    const res = await api.get(`/api/admin/withdrawal/requests/${withdrawal_id}`, config);

    if (res.data && res.data.status === true && res.data.response) {
      dispatch(withdrawalRequestDetailsById(res.data.response));
      return { status: true, response: res.data.response };
    } else {
      dispatch(setAlert("Withdrawal request not found", "danger"));
      return { status: false };
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          withdrawalRequestError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || "Error fetching withdrawal request", "danger"));
    }
    return { status: false };
  }
};

export const approveWithdrawalRequest =
  (withdrawal_id, formData, navigate) => async (dispatch) => {
    dispatch(removeErrors());
    dispatch(loadingOnWithdrawalRequestSubmit());
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const res = await api.post(
        `/api/admin/withdrawal/approve/${withdrawal_id}`,
        formData,
        config
      );

      if (res.data && res.data.status === true) {
        dispatch(withdrawalRequestApproved(withdrawal_id));
        dispatch(setAlert(res.data.message || "Withdrawal request approved.", "success"));
        // Refresh the request details
        await dispatch(getWithdrawalRequestById(withdrawal_id));
        if (navigate) {
          setTimeout(() => {
            navigate("/admin/users/withdrawal-requests/list");
          }, 1500);
        }
        return { status: true };
      } else {
        const errors = res.data?.errors;
        if (errors && Array.isArray(errors)) {
          dispatch(setErrors(errors));
        }
        dispatch(setAlert(res.data?.message || "Failed to approve withdrawal request.", "danger"));
        return { status: false };
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        const errors = err.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          dispatch(setErrors(errors));
        }
        err.response &&
          dispatch(
            withdrawalRequestError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response?.data?.message || err.response?.message || "Failed to approve withdrawal request.", "danger"));
      }
      return { status: false };
    }
  };

export const rejectWithdrawalRequest =
  (withdrawal_id, formData, navigate) => async (dispatch) => {
    dispatch(removeErrors());
    dispatch(loadingOnWithdrawalRequestSubmit());
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const res = await api.post(
        `/api/admin/withdrawal/reject/${withdrawal_id}`,
        formData,
        config
      );

      if (res.data && res.data.status === true) {
        dispatch(withdrawalRequestRejected(withdrawal_id));
        dispatch(setAlert(res.data.message || "Withdrawal request rejected.", "success"));
        // Refresh the request details
        await dispatch(getWithdrawalRequestById(withdrawal_id));
        if (navigate) {
          setTimeout(() => {
            navigate("/admin/users/withdrawal-requests/list");
          }, 1500);
        }
        return { status: true };
      } else {
        const errors = res.data?.errors;
        if (errors && Array.isArray(errors)) {
          dispatch(setErrors(errors));
        }
        dispatch(setAlert(res.data?.message || "Failed to reject withdrawal request.", "danger"));
        return { status: false };
      }
    } catch (err) {
      console.error("Error rejecting withdrawal:", err);
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        const errors = err.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          dispatch(setErrors(errors));
        }
        err.response &&
          dispatch(
            withdrawalRequestError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response?.data?.message || err.response?.message || "Failed to reject withdrawal request.", "danger"));
      }
      return { status: false };
    }
  };

export const cancelSave = (navigate) => async (dispatch) => {
  dispatch(removeErrors());
  navigate("/admin/withdrawals");
};

// reset errors
export const removeWithdrawalRequestErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetWithdrawalRequest());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(withdrawalRequestError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};
