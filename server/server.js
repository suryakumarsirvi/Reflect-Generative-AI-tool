import app from './src/app.js';
import { connectDB } from './src/configs/db.config.js';
import { CONFIG } from './src/configs/env.config.js';

connectDB();

app.listen(CONFIG.SERVER_PORT, () => {
  console.log(`Server is running on host ${CONFIG.SERVER_HOST} and port ${CONFIG.SERVER_PORT}`);
});
