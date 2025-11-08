import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import SignIn from "@/pages/SignIn";
import OTPVerify from "@/pages/OTPVerify";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import AdminVerifications from "@/pages/AdminVerifications";
import PartnerDashboard from "@/pages/PartnerDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import BrokerDashboard from "@/pages/BrokerDashboard";
import Payment from "@/pages/Payment";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-otp" component={OTPVerify} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/dashboard/customer" component={CustomerDashboard} />
      <Route path="/dashboard/investor" component={InvestorDashboard} />
      <Route path="/dashboard/vendor" component={VendorDashboard} />
      <Route path="/dashboard/broker" component={BrokerDashboard} />
      <Route path="/superadmin/dashboard" component={SuperAdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/verifications" component={AdminVerifications} />
      <Route path="/partner/dashboard" component={PartnerDashboard} />
      <Route path="/payment" component={Payment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
