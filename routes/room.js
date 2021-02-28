const express = require("express");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");
const router = express.Router();

//Importation des modèles
const User = require("../models/User");
const Room = require("../models/Room");

router.post("/room/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, location } = req.fields;
    const user = req.user;
    if (user) {
      if (title && description && price && location.lat && location.lng) {
        const newRoom = new Room({
          title: title,
          description: description,
          price: price,
          location: [location.lat, location.lng],
          user: user.populate("user"),
        });

        await newRoom.save();

        const userToUpdate = await User.findById(user._id);
        userToUpdate.rooms.push(newRoom);
        userToUpdate.markModified("rooms");
        await userToUpdate.save();

        res.status(200).json({
          photos: newRoom.photos,
          location: newRoom.location,
          _id: newRoom._id,
          title: newRoom.title,
          description: newRoom.description,
          price: newRoom.price,
          user: newRoom.user,
        });
      } else {
        res.json(400).json({ message: "Missing parameters" });
      }
    } else {
      res.json(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.json(400).json({ error: error.message });
  }
});

router.get("/rooms", async (req, res) => {
  try {
    const createFilters = (req) => {
      const filters = {};

      if (req.query.title) {
        filters.title = new RegExp(req.query.title, "i");
      }
      if (req.query.priceMin) {
        filters.price = {};
        filters.price.$gte = req.query.priceMin;
      }
      if (req.query.priceMax) {
        if (filters.price) {
          filters.price.$lte = req.query.priceMax;
        } else {
          filters.price = {};
          filters.price.$lte = req.query.priceMax;
        }
      }
      return filters;
    };

    // 1 - On appelle la fonction createFilters et on la stocke dans la variable filters
    const filters = createFilters(req);

    // 2 - Trie par ordre croissant et décroissant
    let sort = {};
    if (req.query.sort === "price-asc") {
      sort = { price: 1 };
    } else if (req.query.sort === "price-desc") {
      sort = { price: -1 };
    }

    // 3 - Création de la pagination
    let page = 1;
    let limit = 10;
    if (req.query.page && Number(req.query.page) > 0) {
      page = Number(req.query.page);
      if (req.query.limit) {
        limit = Number(req.query.limit);
      }
    }

    // 4 - Application du filtre et du tri sur le contenu Room de la BDD, en intégrant les infos de l'utilisateur
    const search = await Room.find(filters, { description: false })
      .populate({
        path: "user",
        select: "account",
      })
      .sort(sort)
      .limit(limit)
      .skip(page * limit - limit);

    // 5 - Application des critères de recherche
    const rooms = await search;

    res.status(200).json(rooms);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get("/rooms/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const roomId = req.params.id;
      const roomToUpload = await Room.findById(roomId);
      if (roomToUpload) {
        const user = await User.findById(roomToUpload.user).select(
          "account email"
        );
        roomToUpload.user = user.populate("user");
        res.status(200).json(roomToUpload);
      } else {
        res.status(400).json({ message: "unknown room in database" });
      }
    } else {
      res.status(400).json({ message: "room id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/room/update/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const roomId = req.params.id;
      const roomToUpdate = await Room.findById(roomId);
      if (roomToUpdate && roomToUpdate._id.toString() === roomId) {
        const user = await User.findById(roomToUpdate.user.toString());
        if (user._id.toString() === req.user._id.toString()) {
          const { title, description, price, location } = req.fields;
          if (title || description || price || location) {
            if (title && title !== roomToUpdate.title) {
              roomToUpdate.title = title;
            }
            if (description && description !== roomToUpdate.description) {
              roomToUpdate.description = description;
            }
            if (price && price !== roomToUpdate.price) {
              roomToUpdate.price = price;
            }
            if (location && location !== roomToUpdate.location) {
              roomToUpdate.location = location;
            }
            await roomToUpdate.save();
            res.status(200).json({
              photos: roomToUpdate.photos,
              location: roomToUpdate.location,
              _id: roomToUpdate._id,
              title: roomToUpdate.title,
              description: roomToUpdate.description,
              price: roomToUpdate.price,
              user: roomToUpdate.user,
            });
          } else {
            res.status(400).json({ message: "bad request" });
          }
        } else {
          res.status(401).json({ message: "Unauthorized user" });
        }
      } else {
        res.status(400).json({ message: "unknown room in database" });
      }
    } else {
      res.status(400).json({ message: "room id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/room/delete/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const roomId = req.params.id;
      const roomToDelete = await Room.findById(roomId);
      if (roomToDelete && roomToDelete._id.toString() === roomId) {
        const user = await User.findById(roomToDelete.user.toString());
        if (user._id.toString() === req.user._id.toString()) {
          const userRooms = user.rooms;
          const position = userRooms.indexOf(roomId);
          if (position > -1) {
            user.rooms.splice(position, 1);
            user.markModified("rooms");
            await user.save();
            await roomToDelete.deleteOne();
            res.status(200).json({ message: "Room deleted" });
          } else {
            res.status(400).json({ message: "bad request" });
          }
        } else {
          res.status(401).json({ message: "Unauthorized user" });
        }
      } else {
        res.status(400).json({ message: "unknown room in database" });
      }
    } else {
      res.status(400).json({ message: "room id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.put("/room/upload_picture/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const roomToUpdate = await Room.findById(req.params.id);
      if (roomToUpdate) {
        const { picture1, picture2, picture3, picture4, picture5 } = req.files;
        if (picture1 || picture2 || picture3 || picture4 || picture5) {
          if (String(roomToUpdate.user) === String(req.user._id)) {
            const tabPhotos = roomToUpdate.photos;
            if (5 - tabPhotos.length > 0 && 5 - tabPhotos.length <= 5) {
              for (let i = 1; i < 6; i++) {
                if (req.files[`picture${i}`]) {
                  let pictureToUpload = req.files[`picture${i}`].path;
                  await cloudinary.uploader.upload(
                    pictureToUpload,
                    {
                      folder: `/airbnb/rooms/${req.user._id}/${req.params.id}`,
                      picture_id: `picture${i}`,
                    },
                    (error, result) => {
                      let newPicture = {
                        url: result.secure_url,
                        picture_id: result.public_id,
                      };
                      tabPhotos.push(newPicture);
                    }
                  );
                }
              }

              await Room.findByIdAndUpdate(req.params.id, {
                photos: tabPhotos,
              });

              const roomUpdated = await Room.findById(req.params.id);
              res.status(200).json(roomUpdated);
            } else {
              res.status(400).json({ error: "Can't add more than 5 pictures" });
            }
          } else {
            res.status(401).json({ error: "Unauthorized" });
          }
        } else {
          res.status(400).json({ error: "picture is missing" });
        }
      } else {
        res.status(400).json({ error: "unknown room id" });
      }
    } else {
      res.status(400).json({ error: "room id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.put("/room/delete_picture/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const roomToUpdate = await Room.findById(req.params.id);
      if (roomToUpdate) {
        const userId = req.user._id;
        const roomUserId = roomToUpdate.user;
        if (String(userId) === String(roomUserId)) {
          const picture_id = req.query.picture_id;
          if (picture_id) {
            const allPhotos = roomToUpdate.photos;
            let isPhoto = false;
            let index;
            for (let i = 0; i < allPhotos.length; i++) {
              let tab = allPhotos[i].picture_id.split("/");
              p_id = tab.pop();
              if (picture_id === p_id) {
                isPhoto = true;
                index = i;
                break;
              }
            }
            if (isPhoto) {
              allPhotos.splice(index, 1);
              await cloudinary.uploader.destroy(
                `airbnb/rooms/${req.user._id}/${req.params.id}/${picture_id}`
              );
              const update = await Room.findByIdAndUpdate(req.params.id, {
                photos: allPhotos,
              });
              res.status(200).json({ message: "Picture deleted", update });
            } else {
              res.status(400).json({ error: "Picture not found" });
            }
          } else {
            res.status(400).json({ error: "picture id is missing" });
          }
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({ error: "unknown room id" });
      }
    } else {
      res.status(400).json({ error: "room id is missing" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
