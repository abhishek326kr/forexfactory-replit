import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSitemap, generateSitemapIndex, generateNewsSitemap } from "./sitemap";
import { generateRobotsTxt, generateDynamicRobotsTxt } from "./robots";
import { generateRssFeed, generateDownloadsRssFeed, generateAtomFeed } from "./feed";

export async function registerRoutes(app: Express): Promise<Server> {
  // SEO Routes - These should be at the root level, not under /api

  // Robots.txt
  app.get("/robots.txt", generateDynamicRobotsTxt);
  
  // XML Sitemaps
  app.get("/sitemap.xml", generateSitemap);
  app.get("/sitemap-index.xml", generateSitemapIndex);
  app.get("/sitemap-news.xml", generateNewsSitemap);
  
  // RSS/Atom Feeds
  app.get("/rss.xml", generateRssFeed);
  app.get("/feed.xml", generateRssFeed); // Alternative RSS endpoint
  app.get("/rss", generateRssFeed); // Alternative RSS endpoint without extension
  app.get("/rss-downloads.xml", generateDownloadsRssFeed);
  app.get("/atom.xml", generateAtomFeed);
  app.get("/feed/atom", generateAtomFeed); // Alternative Atom endpoint
  
  // API Routes - Prefix all API routes with /api
  
  // Example API endpoints (you can add your actual API routes here)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Posts API endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      // Implement your posts fetching logic here
      res.json({ posts: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });
  
  // Downloads API endpoints
  app.get("/api/downloads", async (req, res) => {
    try {
      // Implement your downloads fetching logic here
      res.json({ downloads: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });
  
  // Categories API endpoints
  app.get("/api/categories", async (req, res) => {
    try {
      // Implement your categories fetching logic here
      res.json({ categories: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // Newsletter subscription endpoint
  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      // Implement newsletter subscription logic here
      res.json({ success: true, message: "Successfully subscribed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });
  
  // Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const { q, type } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      // Implement search logic here
      res.json({ results: [], query: q, type: type || "all" });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
