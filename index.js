const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello world sultan')
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdscwoz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const categoryCollection = client.db("petAdoptions").collection("categories")
const petCollection = client.db("petAdoptions").collection("pets")
const userAdoptionCollection = client.db("petAdoptions").collection("userAdoption")

//GET Method: categories 
app.get('/api/v1/pets-category', async (req, res) => {
  const result = await categoryCollection.find().toArray();
  res.send(result)
})

//Get Method: pet all
app.get('/api/v1/user/pets', async (req, res) => {
  const queryEmail = req.query.email
  let query = {};
  if (req.query?.email) {
    query.email = queryEmail
  }
  const result = await petCollection.find(query).toArray();
  res.send(result)
})


//Delete Method: my pets
app.delete('/api/v1/user/pets-delete/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await petCollection.deleteOne(query)
  res.send(result)
})


//Get Method: one pet Details
app.get('/api/v1/pets-details/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await petCollection.findOne(query)
  res.send(result)
})

//Get Method: categories pet
app.get('/api/v1/pets-categories/:category', async (req, res) => {
  const pets = req.params.category;
  const query = { category: pets };
  const result = await petCollection.find(query).toArray();
  res.send(result)
})

//Post Method: user adoption
app.post('/api/v1/user/pet-adoption', async (req, res) => {
  const body = req.body;
  const result = await userAdoptionCollection.insertOne(body)
  // console.log(result);
  res.send(result)
})
//Get Method: user adoption request
app.get('/api/v1/user/pet-adoption', async (req, res) => {
  const queryEmail = req.query.email
  let query = {};
  if (req.query?.email) {
    query.ownerEmail = queryEmail
  }
  const result = await userAdoptionCollection.find(query).toArray();
  res.send(result)
})

//Post Method: User Pets add
app.post('/api/v1/user/pet-create', async (req, res) => {
  const pet = req.body;
  const result = await petCollection.insertOne(pet)
  console.log(result);
  res.send(result)
})
//patch Method: update pet
app.patch('/api/v1/user/pet-create/:id', async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updateDoc = {
    $set: {
      name: item.name,
      age: item.age,
      category: item.category,
      location: item.location,
      shortDescription: item.shortDescription,
      longDescription: item.longDescription,
      image: item.image,
    }
  }
  const result = await petCollection.updateOne(filter,updateDoc)
  res.send(result)

})

app.listen(port, () => {
  console.log(`pet adoption server port: ${port}`);
})