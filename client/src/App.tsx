import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, ProtectedRoute } from "@/hooks/useAuth";

// Import pages
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Downloads from "@/pages/Downloads";
import DownloadDetail from "@/pages/DownloadDetail";
import Category from "@/pages/Category";
import Search from "@/pages/Search";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

// Import authentication pages
import Login from "@/pages/Login";

// Import admin pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import PostEditor from "@/pages/Admin/PostEditor";
import DownloadManager from "@/pages/Admin/DownloadManager";
import Analytics from "@/pages/Admin/Analytics";

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/downloads" component={Downloads} />
      <Route path="/download/:id" component={DownloadDetail} />
      <Route path="/category/:category" component={Category} />
      <Route path="/search" component={Search} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      
      {/* Authentication */}
      <Route path="/login" component={Login} />
      
      {/* Admin routes - Protected */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/posts">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/editor">
        <ProtectedRoute requireAdmin={true}>
          <PostEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/editor/:id">
        <ProtectedRoute requireAdmin={true}>
          <PostEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/downloads">
        <ProtectedRoute requireAdmin={true}>
          <DownloadManager />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute requireAdmin={true}>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/:section">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
