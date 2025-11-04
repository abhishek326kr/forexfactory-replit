import { Request, Response } from 'express';

const SITE_URL = 'https://forexfactory.cc';

export function generateRobotsTxt(_req: Request, res: Response) {
  // Build robots.txt content
  let robotsTxt = '';
  
  // Default rules for all bots
  robotsTxt += '# ForexFactory.cc Robots.txt\n';
  robotsTxt += '# Last Updated: ' + new Date().toISOString().split('T')[0] + '\n\n';
  
  // Allow all legitimate bots with reasonable crawl rate
  robotsTxt += '# All Search Engines\n';
  robotsTxt += 'User-agent: *\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Disallow: /private/\n';
  robotsTxt += 'Disallow: /tmp/\n';
  robotsTxt += 'Disallow: /temp/\n';
  robotsTxt += 'Disallow: /cache/\n';
  robotsTxt += 'Disallow: /search?\n';
  robotsTxt += 'Disallow: /*?sort=\n';
  robotsTxt += 'Disallow: /*?filter=\n';
  robotsTxt += 'Disallow: /*?page=\n';
  robotsTxt += 'Disallow: /*&page=\n';
  robotsTxt += 'Disallow: /download/direct/\n';
  robotsTxt += 'Disallow: /user/\n';
  robotsTxt += 'Disallow: /profile/\n';
  robotsTxt += 'Disallow: /checkout/\n';
  robotsTxt += 'Disallow: /cart/\n';
  robotsTxt += 'Disallow: /*.pdf$\n';
  robotsTxt += 'Crawl-delay: 1\n\n';
  
  // Googlebot specific rules (no crawl delay for Google)
  robotsTxt += '# Googlebot\n';
  robotsTxt += 'User-agent: Googlebot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Disallow: /private/\n';
  robotsTxt += 'Disallow: /search?\n';
  robotsTxt += 'Disallow: /*?sort=\n';
  robotsTxt += 'Disallow: /*?filter=\n';
  robotsTxt += 'Allow: /downloads/\n';
  robotsTxt += 'Allow: /blog/\n';
  robotsTxt += 'Allow: /category/\n\n';
  
  // Googlebot Image
  robotsTxt += '# Googlebot Image\n';
  robotsTxt += 'User-agent: Googlebot-Image\n';
  robotsTxt += 'Allow: /images/\n';
  robotsTxt += 'Allow: /screenshots/\n';
  robotsTxt += 'Allow: /assets/\n';
  robotsTxt += 'Disallow: /private/\n\n';
  
  // Bingbot specific rules
  robotsTxt += '# Bingbot\n';
  robotsTxt += 'User-agent: Bingbot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Disallow: /private/\n';
  robotsTxt += 'Disallow: /search?\n';
  robotsTxt += 'Crawl-delay: 1\n\n';
  
  // Yandex Bot
  robotsTxt += '# Yandex\n';
  robotsTxt += 'User-agent: Yandex\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Disallow: /private/\n';
  robotsTxt += 'Crawl-delay: 2\n';
  robotsTxt += 'Clean-param: utm_source&utm_medium&utm_campaign\n\n';
  
  // Baidu Spider
  robotsTxt += '# Baidu Spider\n';
  robotsTxt += 'User-agent: Baiduspider\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Disallow: /private/\n';
  robotsTxt += 'Crawl-delay: 2\n\n';
  
  // DuckDuckGo Bot
  robotsTxt += '# DuckDuckBot\n';
  robotsTxt += 'User-agent: DuckDuckBot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Crawl-delay: 1\n\n';
  
  // Facebook Crawler (for social sharing)
  robotsTxt += '# Facebook\n';
  robotsTxt += 'User-agent: facebookexternalhit\n';
  robotsTxt += 'Allow: /\n\n';
  
  robotsTxt += 'User-agent: facebookcatalog\n';
  robotsTxt += 'Allow: /\n\n';
  
  // Twitter Bot (for Twitter cards)
  robotsTxt += '# Twitter\n';
  robotsTxt += 'User-agent: Twitterbot\n';
  robotsTxt += 'Allow: /\n\n';
  
  // LinkedIn Bot
  robotsTxt += '# LinkedIn\n';
  robotsTxt += 'User-agent: LinkedInBot\n';
  robotsTxt += 'Allow: /\n\n';
  
  // WhatsApp Bot
  robotsTxt += '# WhatsApp\n';
  robotsTxt += 'User-agent: WhatsApp\n';
  robotsTxt += 'Allow: /\n\n';
  
  // Pinterest Bot
  robotsTxt += '# Pinterest\n';
  robotsTxt += 'User-agent: Pinterestbot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 1\n\n';
  
  // Slack Bot
  robotsTxt += '# Slackbot\n';
  robotsTxt += 'User-agent: Slackbot\n';
  robotsTxt += 'Allow: /\n\n';
  
  // Discord Bot
  robotsTxt += '# Discord\n';
  robotsTxt += 'User-agent: Discordbot\n';
  robotsTxt += 'Allow: /\n\n';
  
  // Telegram Bot
  robotsTxt += '# Telegram\n';
  robotsTxt += 'User-agent: TelegramBot\n';
  robotsTxt += 'Allow: /\n\n';
  
  // Apple Bot (for Siri and Spotlight Suggestions)
  robotsTxt += '# Apple\n';
  robotsTxt += 'User-agent: Applebot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n\n';
  
  // SEMrush Bot
  robotsTxt += '# SEMrush\n';
  robotsTxt += 'User-agent: SemrushBot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 5\n\n';
  
  robotsTxt += 'User-agent: SemrushBot-SA\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 5\n\n';
  
  // Ahrefs Bot
  robotsTxt += '# Ahrefs\n';
  robotsTxt += 'User-agent: AhrefsBot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 10\n\n';
  
  // Moz Bot
  robotsTxt += '# Moz\n';
  robotsTxt += 'User-agent: dotbot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 10\n\n';
  
  robotsTxt += 'User-agent: rogerbot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 10\n\n';
  
  // Majestic Bot
  robotsTxt += '# Majestic\n';
  robotsTxt += 'User-agent: MJ12bot\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Crawl-delay: 10\n\n';
  
  // Block bad bots
  robotsTxt += '# Bad Bots - Blocked\n';
  robotsTxt += 'User-agent: AhrefsBot/5.0\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: Bytespider\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: PetalBot\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: ia_archiver\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: Nutch\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: MegaIndex\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: Riddler\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: BLEXBot\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: DataForSeoBot\n';
  robotsTxt += 'Disallow: /\n\n';
  
  // AI/ML Bots Control
  robotsTxt += '# AI/ML Training Bots\n';
  robotsTxt += 'User-agent: GPTBot\n';
  robotsTxt += 'Allow: /blog/\n';
  robotsTxt += 'Allow: /downloads/\n';
  robotsTxt += 'Disallow: /api/\n';
  robotsTxt += 'Disallow: /admin/\n';
  robotsTxt += 'Crawl-delay: 10\n\n';
  
  robotsTxt += 'User-agent: ChatGPT-User\n';
  robotsTxt += 'Allow: /\n\n';
  
  robotsTxt += 'User-agent: CCBot\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: anthropic-ai\n';
  robotsTxt += 'Disallow: /\n\n';
  
  robotsTxt += 'User-agent: Claude-Web\n';
  robotsTxt += 'Disallow: /\n\n';
  
  // Sitemaps
  robotsTxt += '# Sitemaps\n';
  robotsTxt += `Sitemap: ${SITE_URL}/sitemap.xml\n`;
  robotsTxt += `Sitemap: ${SITE_URL}/sitemap-news.xml\n`;
  
  // Additional sitemap locations if you have them
  // robotsTxt += `Sitemap: ${SITE_URL}/sitemap-index.xml\n`;
  // robotsTxt += `Sitemap: ${SITE_URL}/sitemap-images.xml\n`;
  // robotsTxt += `Sitemap: ${SITE_URL}/sitemap-videos.xml\n`;
  
  // Host directive (for Yandex)
  robotsTxt += '\n# Host\n';
  robotsTxt += `Host: ${SITE_URL}\n`;
  
  // Set proper content type and send response
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(robotsTxt);
}

// Alternative function to generate a more restrictive robots.txt (for staging/development)
export function generateRestrictiveRobotsTxt(_req: Request, res: Response) {
  let robotsTxt = '';
  
  robotsTxt += '# Restrictive robots.txt - Use for staging/development\n';
  robotsTxt += '# Last Updated: ' + new Date().toISOString().split('T')[0] + '\n\n';
  
  robotsTxt += 'User-agent: *\n';
  robotsTxt += 'Disallow: /\n\n';
  
  // Only allow specific verified bots if needed
  robotsTxt += '# Allow only for testing\n';
  robotsTxt += 'User-agent: Googlebot\n';
  robotsTxt += 'Disallow: /\n';
  robotsTxt += 'Allow: /robots.txt\n\n';
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robotsTxt);
}

// Function to generate a dynamic robots.txt based on environment
export function generateDynamicRobotsTxt(req: Request, res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isProduction) {
    generateRobotsTxt(req, res);
  } else if (isDevelopment) {
    // In development, be more restrictive
    generateRestrictiveRobotsTxt(req, res);
  } else {
    // Default to restrictive for unknown environments
    generateRestrictiveRobotsTxt(req, res);
  }
}