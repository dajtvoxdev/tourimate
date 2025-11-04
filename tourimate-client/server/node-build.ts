import { createServer } from "./index";

const app = createServer();
const port = parseInt(process.env.PORT || "5000", 10);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`🚀 Server is running at http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
