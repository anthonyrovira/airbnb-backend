const isAdmin = async (req, res, next) => {
  try {
    // Vérification de la présence d'un bearer token dans le header de la requête
    if (req.headers.authorization) {
      // Récupération du token envoyée dans la requête
      const token = req.headers.authorization.replace("Bearer ", "");

      if (token === process.env.ADMIN_TOKEN) {
        // Il s'agit bien d'un admin token
        console.log("admin access granted");
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

module.exports = isAdmin;
