import { RequestHandler } from "express";

export interface DemoResponse {
  message: string;
  data?: Record<string, unknown>;
}

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from demo route!",
    data: {
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
};
