import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./components/MainLayout";

import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import ProductMaster from "./pages/ProductMaster";
import ERPEntry from "./pages/ERPEntry";
import ERPDetails from "./pages/ERPDetails";
import Reports from "./pages/Reports";
import AuditTrail from "./pages/AuditTrail";
import Settings from "./pages/Settings";
import Login from "./pages/Login";


function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={<MainLayout />}
      >

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/recipes"
          element={<Recipes />}
        />

        <Route
          path="/recipes/new"
          element={<Recipes />}
        />

        <Route
          path="/recipes/:id"
          element={<Recipes />}
        />

        <Route
          path="/product-master"
          element={<ProductMaster />}
        />

        <Route
          path="/erp-entry"
          element={<ERPEntry />}
        />

        <Route
          path="/erp-entry/:id"
          element={<ERPDetails />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/audit-trail"
          element={<AuditTrail />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;