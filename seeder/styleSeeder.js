import Style from "../models/styleModel.js";

const styles = [
    { title: "Y2K", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056412-y2k%201.jpg" },
    { title: "Casual", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056427-Frame%2082.jpg" },
    { title: "Classic", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056427-Frame%2082%20(1).jpg" },
    { title: "Streetwear", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785503156-Frame%2087.jpg" },
    { title: "Preppy", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056426-Frame%2097.jpg" },
    { title: "Coquette*", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785503162-Frame 90.jpg" },
    { title: "Gothic", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056426-Frame%2099.png" },
    { title: "Vintage", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056426-Frame%20100.jpg" },
    { title: "Acubi", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744785056425-Frame%20101.jpg" },
];

export const seedStyles = async () => {
    try {
        await Style.deleteMany();
        await Style.insertMany(styles);
        console.log("✅ Styles seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
};

