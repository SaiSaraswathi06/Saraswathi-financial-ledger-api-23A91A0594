const express = require("express");
const router = express.Router();
const accountService = require("../services/accountService");

// Create account
router.post("/", async (req, res) => {
  try {
    const account = await accountService.createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Get account details + balance
router.get("/:id", async (req, res) => {
  try {
    const account = await accountService.getAccountById(req.params.id);
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// Get account ledger entries
router.get("/:id/ledger", async (req, res) => {
  try {
    const ledger = await accountService.getAccountLedger(req.params.id);
    res.json(ledger);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

module.exports = router;
