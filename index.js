// La ligne suivante ne doit être utilisée qu'une seule fois et au tout début du projet. De préférence dans index.js
require("dotenv").config(); // Permet d'activer les variables d'environnement qui se trouvent dans le fichier `.env`
const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const morgan = require("morgan");

//connexion à la bdd
mongoose.connect(process.env.MONGODB_URI); // Vous pourrez vous connecter à votre base de données, sans pour autant préciser les identifiants dans le fichier index.js

//Création du serveur
const app = express();
app.use(formidable());
app.use(cors());
app.use(morgan("dev")); //permet de voir dans le terminal, le status de la requete demander (200, 400 ou autre), dev = changement de couleur des status dans le terminal

//import des routes
const userRoutes = require("./routes/users");
app.use(userRoutes);

const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(400).json("Route introuvable !");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started ! ");
});
