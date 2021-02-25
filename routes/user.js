const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const isAdmin = require("../middlewares/isAdmin");
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

//Importation des modèles
const User = require("../models/User");
const Room = require("../models/Room");

router.get("/users", isAdmin, async (req, res) => {
  try {
    const allUsers = await User.find();

    res.status(200).json({ allUsers });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const user = await User.findById(req.params.id);

      res.status(200).json({
        _id: user._id,
        account: user.account,
        rooms: user.rooms,
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/signup", async (req, res) => {
  try {
    if (req.fields.email && req.fields.password && req.fields.username) {
      const { email, username } = req.fields;
      const userEmail = await User.findOne({ email });
      const userUsername = await User.findOne({ username });
      if (userEmail) {
        res.status(400).json({ error: "This email already has an account." });
      } else if (userUsername) {
        res
          .status(400)
          .json({ error: "This username already has an account." });
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

router.post("/user/login", async (req, res) => {
  try {
    if (req.fields.email && req.fields.password) {
      const { email, password } = req.fields;
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

router.post("/user/upload_picture/:id", isAuthenticated, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (userToUpdate._id.toString() === req.user._id.toString()) {
      if (req.files.picture) {
        const pictureToUpload = req.files.picture.path;
        const newPicture = await cloudinary.uploader.upload(
          pictureToUpload,
          {
            folder: `/airbnb/users/${req.params.id}`,
            public_id: "personalPicture",
          },
          async (error, result) => {
            let newPicture = {
              url: result.secure_url,
              picture_id: result.public_id,
            };

            await User.findOneAndUpdate(req.params.id, {
              "account.picture": newPicture,
            });
          }
        );

        res.status(200).json({
          account: {
            picture: {
              url: newPicture.url,
              picture_id: newPicture.public_id,
            },
            username: userToUpdate.account.username,
            description: userToUpdate.account.description,
            name: userToUpdate.account.name,
          },
          _id: userToUpdate._id,
          email: userToUpdate.email,
          rooms: userToUpdate.rooms,
        });
      } else {
        res.status(400).json({ error: "picture is missing" });
      }
    } else {
      res.status(400).json({ error: "unknown user id" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/delete_picture/:id", isAuthenticated, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (userToUpdate._id.toString() === req.user._id.toString()) {
      const public_id = userToUpdate.account.picture.public_id;
      const pictureToDelete = await cloudinary.api.delete_resources(public_id);
      if (pictureToDelete) {
        await cloudinary.api.delete_folder(`airbnb/users/${userToUpdate._id}`);
        userToUpdate.account.picture = undefined;
        await userToUpdate.save();
        res.status(200).json({
          account: {
            picture: null,
            username: userToUpdate.account.username,
            description: userToUpdate.account.description,
            name: userToUpdate.account.name,
          },
          _id: userToUpdate._id,
          email: userToUpdate.email,
          rooms: userToUpdate.rooms,
        });
      } else {
        res.status(400).json({ error: "bad request" });
      }
    } else {
      res.status(400).json({ error: "unknown user id" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.put("/user/update", isAuthenticated, async (req, res) => {
  try {
    if (
      req.fields.username ||
      req.fields.name ||
      req.fields.email ||
      req.fields.description ||
      req.fields.dateOfBirth
    ) {
      const user = await User.findById(req.user._id).select(
        "-token -hash -salt"
      );
      if (user) {
        const { username, name, email, description, dateOfBirth } = req.fields;

        if (email) {
          const alreadyExists = await User.findOne({ email: email });
          if (alreadyExists) {
            res
              .status(400)
              .json({ error: "this email has already an account" });
          } else {
            user.email = email;
          }
        }
        if (username) {
          const alreadyExists = await User.findOne({
            account: {
              username: username,
            },
          });
          if (alreadyExists) {
            res.status(400).json({ error: "this username is already taken" });
          } else {
            user.account.username = username;
          }
        }
        if (name && user.account.name != name) {
          user.account.name = name;
        }
        if (description && user.account.description != description) {
          user.account.description = description;
        }
        if (dateOfBirth && user.account.dateOfBirth != dateOfBirth) {
          user.account.dateOfBirth = dateOfBirth;
        }

        const userUpdated = await user.save();

        res.status(200).json(userUpdated);
      } else {
        res.status(400).json({ error: "unknown user id" });
      }
    } else {
      res.status(400).json({ error: "nothing to update" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.put("/user/update_password", isAuthenticated, async (req, res) => {
  try {
    if (req.fields.previousPassword && req.fields.newPassword) {
      const { previousPassword, newPassword } = req.fields;
      const user = await User.findById(req.user._id);
      const hashPreviousPassword = SHA256(
        previousPassword + user.salt
      ).toString(encBase64);
      console.log(hashPreviousPassword);
      console.log(user.hash);
      if (hashPreviousPassword === user.hash) {
        const newSalt = uid2(64);
        const hashNewPassword = SHA256(newPassword + newSalt).toString(
          encBase64
        );
        /**
         * A CONTINUER
         */
      } else {
        res.status(400).json({ error: "wrong password" });
      }
    } else {
      res
        .status(400)
        .json({ error: "previous and/or new password not provided" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get("/user/rooms/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const user = await User.findById(req.params.id);
      if (user) {
        const userRooms = user.rooms;
        if (userRooms.length > 0) {
          let arrRooms = [];
          for (let i = 0; i < userRooms.length; i++) {
            const room = await Room.findById(userRooms[i]);
            arrRooms.push(room);
          }
          res.status(200).json(arrRooms);
        } else {
          res.status(400).json({ message: "user has no rooms" });
        }
      } else {
        res.status(400).json({ message: "user not found" });
      }
    } else {
      res.status(400).json({ message: "user id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
