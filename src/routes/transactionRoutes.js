const express = require("express");
const router = express.Router();
const transactionService = require("../services/transactionService");

// Deposit
router.post("/deposit", async (req, res) => {
  try {
    const { accountId, amount } = req.body;
    const result = await transactionService.makeDeposit(accountId, amount);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Withdrawal
router.post("/withdraw", async (req, res) => {
  try {
    const { accountId, amount } = req.body;
    const result = await transactionService.makeWithdrawal(accountId, amount);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);

    if (err.message === "Insufficient funds") {
      return res.status(422).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
});

// Transfer
router.post("/transfer", async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    const result = await transactionService.makeTransfer(fromAccountId, toAccountId, amount);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);

    if (err.message === "Insufficient funds") {
      return res.status(422).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
