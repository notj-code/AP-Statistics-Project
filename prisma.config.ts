import { defineConfig, env } from "prisma/config";
import "dotenv/config"; // Import dotenv/config to load environment variables

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
