import { createAuthApp } from "./lib/auth/expressApp";

const app = createAuthApp();
const PORT = 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
