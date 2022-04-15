const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

//import du model Offer
const Offer = require("../models/Offer");

//import du middleware
const isAuthenticated = require("../middlewares/isAuthenticated");

//Je viens configurer cloudinary avec mes identifiants
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      //implanter la réf user : owner = propriétaire donc user
      owner: req.user, // contenu dans la clé req.user déclaré plus haut.
    });

    //J'envoie mon image sur cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: "vinted/offers",
      public_id: `${req.fields.title} - ${newOffer._id}`,
    });

    newOffer.product_image = result;

    await newOffer.save();

    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// ⚠⚠Penser a bien changer le parametre fields en query si je veux que ca fonctionne sur postman
router.get("/offers", async (req, res) => {
  try {
    //je créer un objet vide, que je vais remplir au fur et a mesure
    const filtersObject = {};

    //gestion du Title
    if (req.query.title) {
      filtersObject.product_name = new RegExp(req.query.title, "i");
    } // on ajoute le query titre dans filtersObject qui est un objet vide, je lui ajoute des objets et je passerais la variable dans le find(pour qu'il récupere tous les objet déclaré)

    //gestion du prix
    if (req.query.priceMin) {
      filtersObject.product_price = { $gte: req.query.priceMin }; // $gte = supérieur ou égal (priceMin)
    }
    //si j'ai déjà une clé product_price dans mon objet objectFilters
    if (req.query.priceMax) {
      if (filtersObject.product_price) {
        filtersObject.product_price.$lte = req.query.priceMax;
      } else {
        filtersObject.product_price = {
          $lte: req.query.priceMax, // $lte = inférieur ou egal (priceMax)
        };
      }
    }
    //gestion du tri avec l'objet sortObject
    const sortObject = {};
    if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    }
    // console.log(filtersObject);

    //gestion de la pagination
    // On a par défaut 5 annonces par page
    //Si ma page est égale à 1 je devrais skip 0 annonces
    //Si ma page est égale à 2 je devrais skip 5 annonces
    //Si ma page est égale à 4 je devrais skip 15 annonces

    //(1-1) * 5 = skip 0 ==> PAGE 1
    //(2-1) * 5 = SKIP 5 ==> PAGE 2
    //(4-1) * 5 = SKIP 15 ==> PAGE 4
    // ==> (PAGE - 1) * LIMIT
    let limit = 3;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const offers = await Offer.find(filtersObject)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("product_name product_price");

    const count = await Offer.countDocuments(filtersObject); // affiche le nombre d'article correspondant a ma requete dans ma BDD

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/offer/:id", async (req, res) => {
  // Je récupère le produit par son id
  try {
    const offerById = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username email -_id", // on renvoi le strict minimum au client, donc la juste le nom et l'email (-_id et égal qu'on ne renvoi pas l'id)
    });
    res.status(200).json(offerById);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
