const express = require("express");
const uid2 = require("uid2");
const SHA86 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

//Importation des modèles
const User = require("../models/User");
const SHA256 = require("crypto-js/sha256");

router.post("/user/signup", async (req, res) => {
  try {
    const userCheck = await User.findOne(req.fields.email);
    if (userCheck) {
      const {
        email,
        password,
        username,
        name,
        dateOfBirth,
        description,
      } = req.fields;
      const photoToUpload = req.files.photo.path;
      const regexDate = /\d{4}-\d{2}-\d{2}/g;

      if (email && password && username && name && dateOfBirth && description) {
        if (regexDate.test(dateOfBirth)) {
          const salt = uid2(64);
          const hash = SHA86(password + salt).toString(encBase64);
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

          if (photoToUpload) {
            const newPhoto = await cloudinary.uploader.upload(newPhoto, {
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
            username: newUserReturned.username,
            description: newUserReturned.description,
            name: newUserReturned.name,
          });
        } else {
          res.status(400).json({ error: "Date format is incorrect" });
        }
      } else {
        res.status(400).json({ error: "Missing parameters" });
      }
    } else {
      res.status(400).json({ error: "This email already has an account." });
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
          res.status(401).json({ error: "Wrong password" });
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
