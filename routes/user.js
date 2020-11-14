const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const isAdmin = require("../middlewares/isAdmin");

const router = express.Router();

//Importation des modèles
const User = require("../models/User");
const Room = require("../models/Room");

router.get("/users", isAdmin, async (req, res) => {
  try {
    const allUsers = await User.find();
    //console.log(allUsers);
    res.status(200).json({ allUsers });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username } = req.fields;
    const userEmail = await User.findOne({ email });
    const userUsername = await User.findOne({ username });
    if (userEmail) {
      res.status(400).json({ error: "This email already has an account." });
    } else if (userUsername) {
      res.status(400).json({ error: "This username already has an account." });
    } else {
      const {
        email,
        password,
        username,
        name,
        dateOfBirth,
        description,
      } = req.fields;
      const regexDate = /\d{4}-\d{2}-\d{2}/g;

      if (email && password && username) {
        if (regexDate.test(dateOfBirth)) {
          const salt = uid2(64);
          const hash = SHA256(password + salt).toString(encBase64);
          const token = uid2(64);

          const newUser = new User({
            email: email,
            account: {
              username: username,
              name: name,
              description: description,
              dateOfBirth: dateOfBirth,
            },
            token: token,
            hash: hash,
            salt: salt,
          });

          if (req.files.photo) {
            const photoToUpload = req.files.photo.path;
            const newPhoto = await cloudinary.uploader.upload(photoToUpload, {
              folder: `/airbnb/${newUser._id}`,
              public_id: "personalPicture",
            });
            newUser.account.photo = newPhoto;
          }

          await newUser.save();

          const newUserReturned = await User.findOne({ token: token });
          res.status(200).json({
            _id: newUserReturned._id,
            token: newUserReturned.token,
            email: newUserReturned.email,
            username: newUserReturned.account.username,
            description: newUserReturned.account.description,
            name: newUserReturned.account.name,
          });
        } else {
          res.status(400).json({ error: "Date format is incorrect" });
        }
      } else {
        res.status(400).json({ error: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      error: error.message,
    });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    if (email && password) {
      const user = await User.findOne({ email: email });
      if (user) {
        const hashToCompare = SHA256(password + user.salt).toString(encBase64);
        if (hashToCompare === user.hash) {
          res.status(200).json({
            _id: user._id,
            token: user.token,
            email: email,
            username: user.username,
            description: user.description,
            name: user.name,
          });
        } else {
          res.status(401).json({ error: "Wrong email or password" });
        }
      } else {
        res.status(401).json({ error: "User not yet registered" });
      }
    } else {
      res.status(400).json({ error: "Missing parameters" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      error: error.message,
    });
  }
});

module.exports = router;
