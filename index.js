const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3500;
const { MongoClient, ServerApiVersion } = require("mongodb");
// Middle were;
app.use(express.json());
app.use(cors());

// const verifyJWT = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send({ message: "UnAuthorized Access" });
//     }
//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: "Forbidden Access" });
//         }
//         req.decoded = decoded;
//         next();
//     });
// };

const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASSWORD}@cluster0.mufjr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

app.get("/", (req, res) => {
    res.send("Node is working.");
});
async function runServer() {
    try {
        await client.connect();
    } finally {
    }
}

runServer().catch(console.error);
app.listen(port, () => {
    console.log("listening to the port ", port);
});
