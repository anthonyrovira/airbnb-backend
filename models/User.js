const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { unique: true, required: true, type: String },
  account: {
    username: { unique: true, required: true, type: String },
    description: { type: String, max: 500 },
    picture: mongoose.Schema.Types.Mixed,
  },
  token: { type: String, required: true, min: 64, max: 64 },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
  rooms: [
    // "rooms" permettra de stocker toutes les références vers les annonces créées par l'utilisateur
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
});

module.exports = User;
