const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3500;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// Middle were;
app.use(express.json());
app.use(cors());

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized Access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
};

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
const productsCollection = client
    .db("productsCollection")
    .collection("products");
const ordersCollection = client.db("ordersCollection").collection("orders");
async function runServer() {
    try {
        await client.connect();

        // Verify Admin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const result = await userCollection.findOne({
                email: decodedEmail,
            });
            const role = result?.role;
            // console.log("result", result);
            if (role === "Admin") {
                next();
            } else {
                return res
                    .status(403)
                    .send({ result: false, message: "Forbidden Access" });
            }
        };
        // add User in db and create jwt token
        app.put("/user", async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            let user = { name, email };
            const filter = { email: email };
            const exist = await userCollection.findOne(filter);
            // console.log(exist);
            if (exist) {
                user.role = exist.role;
            } else {
                user.role = "Client";
            }
            // console.log(user, exist);
            const updateDoc = { $set: user };
            const options = { upsert: true };
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

        // Update User role
        app.put("/updateUser", verifyJWT, verifyAdmin, async (req, res) => {
            const user = req.body;
            // console.log(user);
            const filter = { email: user.email };
            const updateDoc = { $set: user };
            const options = { upsert: true };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send({ result });
        });

        // Find User
        app.get("/user", verifyJWT, async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const result = await userCollection.findOne(filter);
            res.send({ result });
        });

        // Delete User
        app.delete("/deleteUser", verifyJWT, async (req, res) => {
            const user = req.body;
            // console.log(user);
            const filter = { email: user.email };
            const result = await userCollection.deleteOne(filter);
            res.send({ result });
        });
        // Find All User
        app.get("/allUsers", verifyJWT, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        //  Create a new Product
        app.post("/addProduct", verifyJWT, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        //  Get all Products
        app.get("/allProducts", async (req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        });

        // Update a Product
        app.put("/updateProduct", verifyJWT, verifyAdmin, async (req, res) => {
            const product = req.body;
            const id = req.query.id;
            // console.log(id);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: product,
            };
            const result = await productsCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            // console.log(result);
            res.send({ result });
        });

        // Delete a Product
        app.delete(
            "/deleteProduct",
            verifyJWT,
            verifyAdmin,
            async (req, res) => {
                const id = req.body;
                const query = { _id: ObjectId(id) };
                const result = await productsCollection.deleteOne(query);
                res.send(result);
            }
        );

        // Get a Product
        app.get("/product", verifyJWT, async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result);
        });

        // Save Orders
        app.post("/addOrder", verifyJWT, async (req, res) => {
            const order = req.body;
            const id = order.ProductId;
            const query = { email: order.email, ProductId: id };
            const exists = await ordersCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, exists: exists });
            } else {
                const result = await ordersCollection.insertOne(order);
                return res.send({ success: true, result });
            }
        });

        // Find All Orders for client
        app.get("/clientAllOrders", verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (email) {
                const query = { email: email };
                const result = await ordersCollection.find(query).toArray();
                // console.log(result);
                res.send(result);
            }
        });

        // Find All Orders for Admin
        app.get("/adminAllOrders", verifyJWT, verifyAdmin, async (req, res) => {
            const result = await ordersCollection.find().toArray();
            res.send(result);
        });

        // Client Delete Order
        app.delete("/deleteClientProduct", verifyJWT, async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        });
    } finally {
    }
}

runServer().catch(console.error);
app.listen(port, () => {
    console.log("listening to the port ", port);
});
