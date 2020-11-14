const mongoose = require("mongoose");

const Room = mongoose.model("Room", {
  title: String,
  description: String,
  price: Number,
  ratingValue: Number,
  reviews: Number,
  photos: [mongoose.Schema.Types.Mixed],
  location: [Number],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // permet de créer une référence vers l'utilisateur ayant ajouté l'annonce
});

module.exports = Room;
