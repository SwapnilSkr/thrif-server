import parcelSize from "../models/parcelSizeModel.js";

const data = [
    {
      "title": "Under 4oz - Ground Advantage",
      "size": "XXS",
      "description": "Jewelry, small accessories",
      "status": "active"
    },
    {
      "title": "Under 8oz - Ground Advantage",
      "size": "XS",
      "description": "Swimwear, small tops, small purses",
      "status": "active"
    },
    {
      "title": "Under 12oz - Ground Advantage",
      "size": "S",
      "description": "Tops, t-shirts, pants",
      "status": "active"
    },
    {
      "title": "Under 1lb - Ground Advantage",
      "size": "M",
      "description": "Jeans, lightweight jumpers",
      "status": "active"
    },
    {
      "title": "Under 2lb - Ground Advantage",
      "size": "L",
      "description": "Hoodies, light jackets, sneakers",
      "status": "active"
    },
    {
      "title": "Under 10lb - Ground Advantage",
      "size": "Xl",
      "description": "Bundles, heavy boots",
      "status": "active"
    }
  ]  

export const seederParcel = async () => {
    try {
        await parcelSize.deleteMany();
        await parcelSize.insertMany(data);
        console.log("✅ Parcel Size seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
}