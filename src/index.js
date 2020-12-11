const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 5000;

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require("./connector");

app.get("/totalRecovered", (req, res) => {
  connection
    .aggregate([
      {
        $group: {
          _id: "total",
          recovered: {
            $sum: "$recovered",
          },
        },
      },
    ])
    .then((result) => {
      res.send({ data: result[0] });
    });
});

app.get("/totalActive", (req, res) => {
  connection
    .aggregate([
      {
        $group: {
          _id: "total",
          active: {
            $sum: {
              $subtract: ["$infected", "$recovered"],
            },
          },
        },
      },
    ])
    .then((result) => {
      res.send({ data: result[0] });
    });
});

app.get("/totalDeath", (req, res) => {
  connection
    .aggregate([
      {
        $group: {
          _id: "total",
          death: {
            $sum: "$death",
          },
        },
      },
    ])
    .then((result) => res.send({ data: result[0] }));
});

app.get("/hotspotStates", (req, res) => {
  connection
    .aggregate([
      {
        $project: {
          _id: 0,
          state: "$state",
          rate: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$infected", "$recovered"] },
                  "$infected",
                ],
              },
              5,
            ],
          },
        },
      },
      {
        $match: {
          rate: { $gt: 0.1 },
        },
      },
    ])
    .then((result) => res.send({ data: result }));
});

app.get("/healthyStates", (req, res) => {
  connection
    .aggregate([
      {
        $project: {
          _id: 0,
          state: 1,
          mortality: {
            $round: [{ $divide: ["$death", "$infected"] }, 5],
          },
        },
      },
      {
        $match: {
          mortality: { $lt: 0.005 },
        },
      },
    ])
    .then((result) => res.send({ data: result }));
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
