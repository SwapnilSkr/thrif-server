import Banner from "../models/bannerModel.js";

const bannerData = [
    { title: "🍓 Now Available! Thrif X Hello Kitty® 🍓", description: "20% off exclusively on Thrif. Use code “HELLOTHRIF”", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744787824781-image.jpg", buttonName: "Shop now", buttonRedirectionURL: "", productIds: [],type:"banner" },
    { title: "Now Available! 3ft X Nike® 👟", description: "20% off exclusively on Thrif. Use code “HELLOTHRIF”", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744787824769-image (1).jpg", buttonName: "Shop Sneakers", buttonRedirectionURL: "", productIds: [],type:"banner" },
    { title: "Best Sellers", description: "check out best sellers of the month on Thrif. You may just find the perfect piece for you wardrode”", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/triffstorage/1747910813094.jpg", buttonName: null, buttonRedirectionURL: "", productIds: [],type:"featured" },
    { title: "Top Seller brand - New Balance", description: "New Balance is the top seller brand of the month on Thrif. Check out their new collection right here”", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/triffstorage/1747912370983.jpg", buttonName: null, buttonRedirectionURL: "", productIds: [],type:"featured" },
]


export const seederBanner = async () => {
    try {
        await Banner.deleteMany();
        await Banner.insertMany(bannerData);
        console.log("✅ Banner seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
}