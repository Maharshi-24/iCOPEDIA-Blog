import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Support from "./pages/Support";

// Admin is lazy-loaded so public visitors never download it. It is never
// prerendered; Vercel serves it the plain app shell (see vercel.json).
const AdminApp = lazy(() => import("./admin/AdminApp"));

/**
 * The route tree, shared by the browser (main.tsx, BrowserRouter) and the
 * build-time prerender (entry-server.tsx, StaticRouter). Old and alias URLs
 * are 301-redirected by vercel.json in production; the <Navigate>s below only
 * cover the dev server.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/support" element={<Support />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/otp-viewer" element={<Navigate to="/admin/otp-viewer" replace />} />
      <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/terms-of-use" element={<Navigate to="/terms" replace />} />
      <Route path="/help" element={<Navigate to="/support" replace />} />
      <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
