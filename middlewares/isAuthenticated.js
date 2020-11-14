const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // Vérification de la présence d'un bearer token dans le header de la requête
    if (req.headers.authorization) {
      // Récupération du token de l'utilisateur
      const token = req.headers.authorization.replace("Bearer ", "");
      // Vérification de la présence de ce token dans la BDD
      const user = await User.findOne({ token: token }).select(
        // Selection des données pertinentes et non sensibles à renvoyer
        "account email rooms _id"
      );
      if (user) {
        //ajout de la clé user récupérée dans l'objet req
        req.user = user;
        return next();
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ message: "Authorisation missing" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
