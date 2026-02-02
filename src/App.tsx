import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ScanPage from "@/pages/ScanPage";
import StudentsPage from "@/pages/StudentsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout title="Dashboard" subtitle="Dashboard Absensi Hari Ini" />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            <Route element={<DashboardLayout title="Scan Absensi" subtitle="Pindai barcode untuk mencatat kehadiran siswa" />}>
              <Route path="/dashboard/scan" element={<ScanPage />} />
            </Route>

            <Route element={<DashboardLayout title="Data Siswa" subtitle="Manajemen data siswa" />}>
              <Route path="/dashboard/students" element={<StudentsPage />} />
            </Route>

            <Route element={<DashboardLayout title="Laporan Semester" subtitle="Rekap kehadiran siswa per semester" />}>
              <Route path="/dashboard/reports" element={<ReportsPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
