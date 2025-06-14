import Admin from "../models/adminModel.js";

const adminData = [
    {
        name: "Admin",
        email: "admin@gmail.com",
        password: "$2b$10$XL8CytOGOkoOGkBAROPfz.lFJKmN6d5vU.fA2tuQepp5C0oJixIcW",
        imageURL:"",
        email_otp: 0, 
        email_otp_verified: true
    },
]


export const seederAdmin = async () => {
    try {
        await Admin.deleteMany();
        await Admin.insertMany(adminData);
        console.log("✅ Admin seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding Admin:", error);
    }
}