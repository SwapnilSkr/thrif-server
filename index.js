import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";
import app from "./server.js";
import { mongoDb } from "./config/database.js";
import {getLocalIp} from "./helpers/helper.js";

dotenv.config();

const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT;

mongoDb();
process.on("SIGINT", async () => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB".red);
    process.exit(0); 
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error.message);
    process.exit(1); 
  }
});

if (isProduction && cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  app.listen(port, () => {
    console.log(`Server is running on ${getLocalIp()}`);
  });
}