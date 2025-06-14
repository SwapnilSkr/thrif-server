import express from "express";
const masterRouter = express.Router();
import { getListByType, getS3BucketDetails, getLinks } from "../controllers/admin/style.js";

//Style
masterRouter.get("/listByType/:type", getListByType);
masterRouter.get("/getS3BucketDetails", getS3BucketDetails);
masterRouter.get("/links", getLinks)
export default masterRouter;