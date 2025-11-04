import express, { Express, Request, Response } from "express";
import cors from "cors";

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/ping", (req: Request, res: Response) => {
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  // Demo endpoint
  app.get("/api/demo", (req: Request, res: Response) => {
    res.json({
      message: "Demo API endpoint",
      data: {
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    });
  });

  // Static files for SPA fallback in production
  if (process.env.NODE_ENV === "production") {
    const path = require("path");
    const spaPath = path.join(__dirname, "../spa");
    app.use(express.static(spaPath));

    // SPA fallback - serve index.html for any non-API routes
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(spaPath, "index.html"));
    });
  }

  return app;
}

// Start server if running directly (not as serverless function)
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
