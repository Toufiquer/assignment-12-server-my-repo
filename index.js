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

const userCollection = client.db("userCollection").collection("user");
async function runServer() {
    try {
        await client.connect();

        // add User in db create jwt token
        app.put("/user", async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const user = { name, email };
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
                expiresIn: "1h",
            });
            res.send({ result, token });
        });

        // Check user role
        app.get("/user", async (req, res) => {
            const result = await userCollection.findOne({
                email: req.query.email,
            });
            const role = result?.role;
            if (role === "admin") {
                return res.send({ result: true });
            } else {
                return res
                    .status(403)
                    .send({ result: false, message: "Forbidden Access" });
            }
        });
    } finally {
    }
}

runServer().catch(console.error);
app.listen(port, () => {
    console.log("listening to the port ", port);
});
