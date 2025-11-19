const express = require("express");
const router = express.Router();
const Link = require("../models/Link");

const CODE_RE = /^[A-Za-z0-9]{6,8}$/;

function randomCode(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

router.post("/", async (req, res) => {
  let { target_url, code } = req.body;
  if (!target_url) return res.status(400).json({ error: "target_url required" });
  if (!isValidUrl(target_url)) return res.status(400).json({ error: "invalid URL" });

  if (code) {
    if (!CODE_RE.test(code)) return res.status(400).json({ error: "Invalid code format" });
    const exists = await Link.findOne({ code });
    if (exists) return res.status(409).json({ error: "code already exists" });
  } else {
    let unique = false;
    while (!unique) {
      code = randomCode(6);
      const exists = await Link.findOne({ code });
      if (!exists) unique = true;
    }
  }

  const link = await Link.create({ code, target_url });
  return res.status(201).json({
    code,
    short_url: `${process.env.BASE_URL}/${code}`,
    target_url
  });
});

router.get("/", async (req, res) => {
  const links = await Link.find().sort({ created_at: -1 });
  res.json(links);
});

router.get("/:code", async (req, res) => {
  const link = await Link.findOne({ code: req.params.code });
  if (!link) return res.status(404).json({ error: "not found" });
  res.json(link);
});

router.delete("/:code", async (req, res) => {
  const deleted = await Link.findOneAndDelete({ code: req.params.code });
  if (!deleted) return res.status(404).json({ error: "not found" });
  res.json({ ok: true });
});

module.exports = router;