const mongoose = require("mongoose");

const Room = mongoose.model("Room", {
  title: {
    type: String,
    max: 20,
  },
  description: {
    type: String,
    max: 500,
  },
  price: {
    type: Number,
    min: 1,
  },
  ratingValue: {
    type: Number,
    min: 0,
    max: 5,
  },
  reviews: Number,
  photos: [mongoose.Schema.Types.Mixed],
  location: {
    type: [Number],
    index: "2d",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // permet de créer une référence vers l'utilisateur ayant ajouté l'annonce
});

module.exports = Room;
