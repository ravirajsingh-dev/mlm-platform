import React from "react";
import { RouterProvider } from "react-router-dom";

import store from "./store.jsx";
import PortalRoutes from "./views/Routing/PortalRoutes.jsx";

import { loadUser } from "@src/actions/auth";

const App = () => {
  React.useEffect(() => {
    store.dispatch(loadUser(PortalRoutes));
  }, []);

  return <RouterProvider router={PortalRoutes} />;
};

export default App;
