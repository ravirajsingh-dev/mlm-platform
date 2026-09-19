import React, { useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Admin custom imports
import AdminLogin from "./view/auth/AdminLogin";
import AdminPrivateRoute from "./view/routing/AdminPrivateRoute";
import AdminLayout from "./view/admin/adminLayout/index";
import { initializeAdminAuth, logoutAuthActions } from "./actions/adminAuth";

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminAuthenticated = useSelector(
    (state) => state.adminAuth.isAdminAuthenticated
  );

  // Only run auth check when entering admin section, not on every sub-route change
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) return;

    if (!isAdminAuthenticated) {
      dispatch(logoutAuthActions());
      navigate("/");
    } else {
      dispatch(initializeAdminAuth(navigate));
    }
  }, [dispatch, navigate, isAdminAuthenticated]);

  return (
    <div id="App">
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<AdminLogin />} />
        <Route element={<AdminPrivateRoute />}>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
