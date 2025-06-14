import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true, 
    },
    imageURL: {
      type: String
    },
    hashColor: {
      type: String,
      default:"#FF2442"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
  },
  { timestamps: true },
  { versionKey: false }
);

const Category = mongoose.model("categories", categorySchema);

export default Category;
