var express = require("express");
var router = express.Router();
const Result = require("../models/result");

/* GET home page. */
router.get("/", function (req, res, next) {
  Result.findAll({ order: [["score", "DESC"]], limit: 5 }).then((results) => {
    res.render("index", {
      title: "Donut Catch",
      results: results,
      // username: results.username,
      // score: results.score,
    });
  });
});

module.exports = router;
