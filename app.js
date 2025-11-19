require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const Link = require("./models/Link");
const linksRouter = require("./routes/links");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI, { dbName: "tinylink" })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: process.env.VERSION || "1.0" });
});

app.use("/api/links", linksRouter);

app.get("/:code", async (req, res, next) => {
  const code = req.params.code;
  if (["api", "healthz", "code"].includes(code)) return next();

  const link = await Link.findOne({ code });
  if (!link) return res.status(404).send("Not found");

  link.clicks += 1;
  link.last_clicked = new Date();
  await link.save();

  return res.redirect(302, link.target_url);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.get("/code/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public/code.html"));
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    version: "1.0"
  });
});


app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});