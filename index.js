const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt =require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();
app.use(cookieParser());
app.use(cors({
  origin:[
    'http://localhost:5174',
    'http://localhost:5173',
   'https://bliss-bite.web.app',
   'https://bliss-bite.firebaseapp.com'
  ],
  credentials:true,
  optionSuccessStatus: 200,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fxxuhv1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    const database = client.db("bliss-bite");
    const food = database.collection("food");
    const requested = database.collection("requests");


    app.get("/my-food/:email",async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const foods =  food.find(query);
      const result = await foods.toArray();
      res.send(result);
    });

    app.get("/get-food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await food.findOne(query);
      res.send(result);
    });

    app.get("/get-featured-food", async (req, res) => {
        const query = { stockStatus: "Available" };
        const cursor = food.find(query).sort({ food_quantity: -1 }); 
        const result = await cursor.toArray();
        res.send(result);
    });
    

    app.post("/add-food", async (req, res) => {
      const foodItem = req.body;
      foodItem.food_quantity=Number(foodItem.food_quantity);
      const result = await food.insertOne(foodItem);
      res.send(result);
    });

    app.post('/request-food', async (req, res) => {
      const foodItem = req.body;
      const result = await requested.insertOne(foodItem);
      const id=foodItem.food_id;
      const filter = { _id: new ObjectId(id) };
      const update={
        $set:{
          stockStatus: "Requested",
        }
      }
      const updateDone = await food.updateOne(filter, update);
      res.send(result);
    });

    app.get("/my-requested-foods/:email",async(req, res)=>{
      const email = req.params.email;
      const query={ requested_by: email};
      const cursor= requested.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })

    app.get("/available-foods",async(req,res)=>{
      const query={stockStatus: "Available"};
      const cursor=food.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })
    app.put("/update-food/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateFood = {
        $set: {
          food_name: updatedData.food_name,
          food_photo: updatedData.food_photo,
          food_quantity: Number(updatedData.food_quantity),
          stockStatus: updatedData.stockStatus,
          selectedDate: updatedData.selectedDate,
          name: updatedData.name,
          email: updatedData.email,
          donator_image: updatedData.donator_image,
          pickup: updatedData.pickup,
          additional_notes: updatedData.additional_notes,
        },
      };
      const result = await food.updateOne(filter, updateFood);
      res.send(result);
    });

    app.delete("/delete-food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await food.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port ");
});
