const express = require("express");
const app = express();

app.use(express.json());

// Import Routes
const accountRoutes = require("./routes/accountRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

// Register Routes
app.use("/accounts", accountRoutes);
app.use("/transactions", transactionRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Financial Ledger API is running...");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
