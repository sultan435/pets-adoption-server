const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

//middleware
app.use(cors({}))
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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const categoryCollection = client.db("petAdoptions").collection("categories")
const petCollection = client.db("petAdoptions").collection("pets")
const userCollection = client.db("petAdoptions").collection("userInfo")
const userAdoptionCollection = client.db("petAdoptions").collection("userAdoption")
const donationCollection = client.db("petAdoptions").collection("donation")
const paymentCollection = client.db("petAdoptions").collection("payments")


const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: 'forbidden access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded
    next()
  })
}

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email }
  const user = await userCollection.findOne(query)
  const isAdmin = user?.role === "admin"
  if (!isAdmin) {
    return res.status(403).send({ message: "forbidden access" })
  }
  next()
}

//jwt
app.post('/api/v1/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
  // console.log(token);
  res.send({ token })
})


//Post method: user Information
app.post('/api/v1/users-info', async (req, res) => {
  const users = req.body;
  const query = { email: users.email }
  const existingUser = await userCollection.findOne(query)
  if (existingUser) {
    return res.send({ message: 'users already exists', insertedId: null })
  }
  const result = await userCollection.insertOne(users)
  res.send(result)
})

//Get Method: All users Information
app.get('/api/v1/users-info', verifyToken, verifyAdmin, async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result)
})

app.delete('/api/v1/users-info/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await userCollection.deleteOne(query)
  res.send(result)
})



app.patch('/api/v1/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updateDoc = {
    $set: {
      role: "admin"
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc)
  res.send(result)
})

app.get('/api/v1/user/admin/:email', verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" })
  }
  const query = { email: email }
  const user = await userCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === "admin"
  }
  res.send({ admin })
})


//GET Method: categories 
app.get('/api/v1/pets-category', async (req, res) => {
  const result = await categoryCollection.find().toArray();
  res.send(result)
})


app.get('/api/v1/users/pets', async (req, res) => {
  const queryEmail = req.query.email
  const queryCategory = req.query.category
    let query = {};
    if (queryEmail) {
      query.email = queryEmail || ""
    }
    if(queryCategory){
      query.category=queryCategory || ""
    }
    const options = {
        sort:{
          dateAndTime: -1,
        }
      }
  const result = await petCollection.find(query,options).toArray();
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

//delete Method: pet adoption request
app.delete('/api/v1/user/pet-rejects/:id',async(req, res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await userAdoptionCollection.deleteOne(query)
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
app.patch('/api/v1/user/pet-update/:id', async (req, res) => {
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
  const result = await petCollection.updateOne(filter, updateDoc)
  res.send(result)

})


//Post Method: create donation campaign

app.post('/api/v1/user/create-donation-campaign', async (req, res) => {
  const pet = req.body;
  const result = await donationCollection.insertOne(pet)
  console.log(result);
  res.send(result)
})

app.get('/api/v1/user/donation-campaign', async (req, res) => {
  const queryEmail = req.query.email
    let query = {};
    if (queryEmail) {
      query.ownerEmail = queryEmail || ""
    }
    const options = {
        sort:{
          dateAndTime: -1,
        }
      }
  const result = await donationCollection.find(query,options).toArray();
  res.send(result)
})


app.get('/api/v1/user/donation-campaign-details/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await donationCollection.findOne(query)
  res.send(result)
})

app.delete('/api/v1/user/donation-campaign-delete/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await donationCollection.deleteOne(query)
  res.send(result)
})

app.patch('/api/v1/user/donation-campaign-update/:id', async (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updateDoc = {
    $set: {
      name: item.name,
      shortDescription: item.shortDescription,
      longDescription: item.longDescription,
      image: item.image,
      maximumAmount: item.maximumAmount,
      highestAmount: item.highestAmount,
    }
  }
  const result = await donationCollection.updateOne(filter, updateDoc)
  res.send(result)
})

//payment api
app.post("/api/v1/create-payment-intent", async (req, res) => {
  const { donation } = req.body;
  if (!donation) {
    return
  }
  const amount = parseInt(donation * 100)
  console.log(amount, "amount inside the intent");
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: [
      "card"
    ],
  })
  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

//Post Payment:Method
app.post('/api/v1/users/payments', async (req, res) => {
  const payment = req.body;
  const result = await paymentCollection.insertOne(payment)
  console.log(result);
  res.send(result)
})
app.delete('/api/v1/users/payments-delete/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await paymentCollection.deleteOne(query)
  console.log(result);
  res.send(result)
})

app.get('/api/v1/users/payments', async (req, res) => {
  const queryEmail = req.query.email
  let query = {};
  if (req.query?.email) {
    query.ownerEmail = queryEmail
  }
  const result = await paymentCollection.find(query).toArray();
  res.send(result)
})


app.listen(port, () => {
  console.log(`pet adoption server port: ${port}`);
})