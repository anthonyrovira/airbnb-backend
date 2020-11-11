const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
});

// Importation des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);

app.all("*", (req, res) => {
  console.log("Route is not defined");
  res.status(400).json({
    error: error.message,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server has started on port ${process.env.PORT}`);
});
