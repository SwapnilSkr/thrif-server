import mongoose from "mongoose";

export const mongoDb = () => {
  mongoose
    .connect(process.env.MONGO_URL, {})
    .then(console.log("Mongo DB Connection Successfull! ✅"))
    .catch((error) => {
      console.log(`${error.message}`);
      process.exit(1);
    });
};
