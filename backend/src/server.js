import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';

const startServer = async () => {
  try {
    // Database connection initialization
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`========================================`);
      console.log(`  EXAMINATION PORTAL BACKEND ACTIVE      `);
      console.log(`  URL: http://localhost:${env.PORT}      `);
      console.log(`  Environment: ${env.NODE_ENV}           `);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error(`Fatal Server Error: ${err.message}`);
    process.exit(1);
  }
};

startServer();
