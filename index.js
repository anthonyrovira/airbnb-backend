const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const helmet = require("helmet");

require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());
app.use(helmet());

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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(("Access-Control-Allow-Headers", "*"));
  next();
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
  console.log(`Server has started on port ${process.env.PORT || 3000}`);
});
