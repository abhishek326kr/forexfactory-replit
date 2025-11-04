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
import BlogDetail from "@/pages/BlogDetail";
import Downloads from "@/pages/Downloads";
import SignalDetail from "@/pages/SignalDetail";
import Category from "@/pages/Category";
import Search from "@/pages/Search";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

// Import authentication pages
import Login from "@/pages/Login";

// Import admin pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import BlogList from "@/pages/Admin/BlogList";
import SignalList from "@/pages/Admin/SignalList";
import SignalEditor from "@/pages/Admin/SignalEditor";
import CategoryList from "@/pages/Admin/CategoryList";
import UserList from "@/pages/Admin/UserList";
import MediaManager from "@/pages/Admin/MediaManager";
import SeoManager from "@/pages/Admin/SeoManager";
import Analytics from "@/pages/Admin/Analytics";
import PostEditor from "@/pages/Admin/PostEditor";
import DownloadManager from "@/pages/Admin/DownloadManager";

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogDetail} />
      <Route path="/downloads" component={Downloads} />
      <Route path="/download/:id" component={SignalDetail} />
      <Route path="/category/:category" component={Blog} />
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
      
      {/* Signal/EA Management */}
      <Route path="/admin/signals">
        <ProtectedRoute requireAdmin={true}>
          <SignalList />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/signals/new">
        <ProtectedRoute requireAdmin={true}>
          <SignalEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/signals/edit/:id">
        <ProtectedRoute requireAdmin={true}>
          <SignalEditor />
        </ProtectedRoute>
      </Route>
      
      {/* Category Management */}
      <Route path="/admin/categories">
        <ProtectedRoute requireAdmin={true}>
          <CategoryList />
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
      
      {/* SEO Manager */}
      <Route path="/admin/seo">
        <ProtectedRoute requireAdmin={true}>
          <SeoManager />
        </ProtectedRoute>
      </Route>
      
      {/* Legacy routes for compatibility */}
      <Route path="/admin/downloads">
        <ProtectedRoute requireAdmin={true}>
          <DownloadManager />
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
