const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Importation des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const roomRoutes = require("./routes/room");
app.use(roomRoutes);

app.all("*", (req, res) => {
  console.log("Route is not defined");
  res.status(404).json({
    error: error.message,
  });
});

app.listen(process.env.PORT || 3000, () => {
  const host = process.env.MONGODB_URI.replace("mongodb://", "");
  const port = process.env.PORT || 3000;
  console.log("App listening at http://%s:%s", host, port);
});
