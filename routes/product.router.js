import express from "express";
const productRouter = express.Router();
import {
    addProduct, getAllAdded, addPost, getSelfPost, getProductById, getPostById, addToWishlist, wishlist, addReview, reviewListByProdId, sendOffer, sellerUpdateOffer, buyerUpdateOffer, offerList,
    addItemToCart, cartList, deleteItemFromCart, editCart,fetchPost,addComment,replyComment,getProductBySellerId,fetchRecentViewProducts,updateReview,reviewCheck,postDelete,productDelete
} from "../controllers/shop/productCon.js";
import verifyUser from "../middleware/rbac.js";
productRouter.use(verifyUser());

productRouter.post("/add", addProduct);
productRouter.get("/getSelf", getAllAdded);
productRouter.get("/getById/:productId", getProductById);
productRouter.get("/getPostById/:postId", getPostById);
productRouter.post("/getProductByStyleId", getProductBySellerId);
productRouter.delete("/deletePostById/:postId", postDelete);
productRouter.delete("/deleteProductById/:productId", productDelete);

// productRouter.put("/update", addProduct);
// productRouter.delete("/delete", addProduct);

productRouter.post("/addPost", addPost);
productRouter.get("/getSelfPost", getSelfPost);

productRouter.post("/addRemoveFromWishlist", addToWishlist);
productRouter.get("/wishlist", wishlist);

productRouter.post("/addReview", addReview);
productRouter.get("/reviewListByProdId/:prodId", reviewListByProdId);
productRouter.put("/updateReview",updateReview);
productRouter.post("/reviewCheck", reviewCheck);

productRouter.post("/sendOffer", sendOffer);
productRouter.get("/offerList", offerList);
// productRouter.get("/userOfferList", userOfferList);
// productRouter.get("/sellerOfferList", sellerOfferList);
productRouter.put("/sellerUpdateOffer", sellerUpdateOffer);
productRouter.put("/buyerUpdateOffer", buyerUpdateOffer);


// Cart
productRouter.post("/addItemToCart", addItemToCart);
productRouter.get("/cartItemList", cartList);
productRouter.delete("/deleteItemFromCart/:id", deleteItemFromCart);
productRouter.put("/editItemCart", editCart);

// POST
productRouter.get("/fetchPost", fetchPost);
productRouter.post("/addComment", addComment);
productRouter.put("/replyComment", replyComment);

productRouter.get("/fetchRecentViewProducts", fetchRecentViewProducts);
export default productRouter;