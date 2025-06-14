import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "THRIF",
        description: "Welcome to THRIF API's 2025"
    },
    host: "localhost:5001", 
    schemes: ["http"]
};

const swaggerOutput = "./swaggerOutput.json";
const swaggerURL = ["./server.js"];

swaggerAutogen(swaggerOutput, swaggerURL, doc);
