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
import BlogEnhanced from "@/pages/BlogEnhanced";
import BlogDetail from "@/pages/BlogDetail";
import Category from "@/pages/Category";
import SearchResults from "@/pages/SearchResults";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Signals from "@/pages/Signals";

// Import authentication pages
import Login from "@/pages/Login";
import UserLogin from "@/pages/UserLogin";

// Import user pages
import UserSettings from "@/pages/UserSettings";

// Import admin pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import BlogList from "@/pages/Admin/BlogList";
import CategoryList from "@/pages/Admin/CategoryList";
import UserList from "@/pages/Admin/UserList";
import MediaManager from "@/pages/Admin/MediaManager";
import SEO from "@/pages/Admin/SEO";
import Analytics from "@/pages/Admin/Analytics";
import PostEditor from "@/pages/Admin/PostEditor";
import Settings from "@/pages/Admin/Settings";
import SignalList from "@/pages/Admin/SignalList";
import SignalEditor from "@/pages/Admin/SignalEditor";
import SignalUploader from "@/pages/Admin/SignalUploader";
import SignalDetail from "@/pages/SignalDetail";
import EmailManagement from "@/pages/Admin/EmailManagement";
import DownloadAnalytics from "@/pages/Admin/DownloadAnalytics";

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/" component={Home} />
      <Route path="/blog" component={BlogEnhanced} />
      <Route path="/blog/:slug" component={BlogDetail} />
      <Route path="/category/:category" component={BlogEnhanced} />
      <Route path="/signals" component={Signals} />
      <Route path="/signals/:id" component={SignalDetail} />
      <Route path="/search" component={SearchResults} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      
      {/* Authentication */}
      <Route path="/login" component={Login} />
      <Route path="/user/login" component={UserLogin} />
      
      {/* User Settings - Protected */}
      <Route path="/settings">
        <ProtectedRoute>
          <UserSettings />
        </ProtectedRoute>
      </Route>
      
      {/* Admin routes - Protected */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Blog Management */}
      <Route path="/admin/blogs">
        <ProtectedRoute requireAdmin={true}>
          <BlogList />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/blogs/new">
        <ProtectedRoute requireAdmin={true}>
          <PostEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/blogs/edit/:id">
        <ProtectedRoute requireAdmin={true}>
          <PostEditor />
        </ProtectedRoute>
      </Route>
      
      {/* Category Management */}
      <Route path="/admin/categories">
        <ProtectedRoute requireAdmin={true}>
          <CategoryList />
        </ProtectedRoute>
      </Route>
      
      {/* Signal Management */}
      <Route path="/admin/signals">
        <ProtectedRoute requireAdmin={true}>
          <SignalList />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/signals/new">
        <ProtectedRoute requireAdmin={true}>
          <SignalUploader />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/signals/edit/:id">
        <ProtectedRoute requireAdmin={true}>
          <SignalEditor />
        </ProtectedRoute>
      </Route>
      
      {/* User Management */}
      <Route path="/admin/users">
        <ProtectedRoute requireAdmin={true}>
          <UserList />
        </ProtectedRoute>
      </Route>
      
      {/* Media Manager */}
      <Route path="/admin/media">
        <ProtectedRoute requireAdmin={true}>
          <MediaManager />
        </ProtectedRoute>
      </Route>
      
      {/* Analytics */}
      <Route path="/admin/analytics">
        <ProtectedRoute requireAdmin={true}>
          <Analytics />
        </ProtectedRoute>
      </Route>
      
      {/* Email Management */}
      <Route path="/admin/email-management">
        <ProtectedRoute requireAdmin={true}>
          <EmailManagement />
        </ProtectedRoute>
      </Route>
      
      {/* Download Analytics */}
      <Route path="/admin/download-analytics">
        <ProtectedRoute requireAdmin={true}>
          <DownloadAnalytics />
        </ProtectedRoute>
      </Route>
      
      {/* SEO Dashboard */}
      <Route path="/admin/seo">
        <ProtectedRoute requireAdmin={true}>
          <SEO />
        </ProtectedRoute>
      </Route>
      
      {/* Settings */}
      <Route path="/admin/settings">
        <ProtectedRoute requireAdmin={true}>
          <Settings />
        </ProtectedRoute>
      </Route>
      
      {/* Legacy routes for compatibility */}
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
