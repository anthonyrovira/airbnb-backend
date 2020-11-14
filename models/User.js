const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { unique: true, required: true, type: String },
  account: {
    username: { unique: true, required: true, type: String },
    name: { type: String, max: 25 },
    description: { type: String, max: 500 },
    dateOfBirth: Date,
    photo: mongoose.Schema.Types.Mixed,
  },
  token: { type: String, min: 64, max: 64 },
  hash: String,
  salt: String,
  rooms: [
    // "rooms" permettra de stocker toutes les références vers les annonces créées par l'utilisateur
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
});

module.exports = User;
