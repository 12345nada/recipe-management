import { 
  Navigate, 
  Route, 
  Routes, 
} from "react-router-dom"; 

import { 
  AuthProvider, 
} from "./context/AuthContext"; 

import ProtectedRoute from "./components/auth/ProtectedRoute"; 

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
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtp from "./pages/VerifyResetOtp";
import ResetPassword from "./pages/ResetPassword";


function App() { 
  return ( 
    <AuthProvider> 

      <Routes> 

        {/* ===================================== 
            LOGIN 
        ===================================== */} 

        <Route 
          path="/login" 
          element={<Login />} 
        /> 


        {/* =====================================
            ADMIN / MANAGER PASSWORD RECOVERY
        ===================================== */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/verify-reset-otp"
          element={<VerifyResetOtp />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ===================================== 
            MAIN SYSTEM 
        ===================================== */} 

        <Route 
          element={<MainLayout />} 
        > 

          {/* ================================ 
              DASHBOARD 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="Dashboard" 
              /> 
            } 
          > 
            <Route 
              path="/dashboard" 
              element={<Dashboard />} 
            /> 
          </Route> 


          {/* ================================ 
              RECIPES 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="Recipes" 
              /> 
            } 
          > 
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
          </Route> 


          {/* ================================ 
              PRODUCT MASTER 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="Product Master" 
              /> 
            } 
          > 
            <Route 
              path="/product-master" 
              element={<ProductMaster />} 
            /> 
          </Route> 


          {/* ================================ 
              ERP ENTRY 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="ERP Entry" 
              /> 
            } 
          > 
            <Route 
              path="/erp-entry" 
              element={<ERPEntry />} 
            /> 

            <Route 
              path="/erp-entry/:id" 
              element={<ERPDetails />} 
            /> 
          </Route> 


          {/* ================================ 
              REPORTS 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="Reports" 
              /> 
            } 
          > 
            <Route 
              path="/reports" 
              element={<Reports />} 
            /> 
          </Route> 


          {/* ================================ 
              AUDIT TRAIL 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                moduleName="Audit Trail" 
              /> 
            } 
          > 
            <Route 
              path="/audit-trail" 
              element={<AuditTrail />} 
            /> 
          </Route> 


          {/* ================================ 
              SETTINGS + USERS / ROLES 
          ================================ */} 

          <Route 
            element={ 
              <ProtectedRoute 
                anyOfModules={[ 
                  "Settings", 
                  "Users / Role", 
                ]} 
              /> 
            } 
          > 
            <Route 
              path="/settings" 
              element={<Settings />} 
            /> 
          </Route> 

        </Route> 


        {/* ===================================== 
            DEFAULT ROUTE 
        ===================================== */} 

        <Route 
          path="/" 
          element={ 
            <Navigate 
              to="/login" 
              replace 
            /> 
          } 
        /> 


        {/* ===================================== 
            UNKNOWN ROUTES 
        ===================================== */} 

        <Route 
          path="*" 
          element={ 
            <Navigate 
              to="/login" 
              replace 
            /> 
          } 
        /> 

      </Routes> 

    </AuthProvider> 
  ); 
} 


export default App;
