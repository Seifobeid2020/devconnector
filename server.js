const express = require("express");
const app = express();
app.get("/", (req, res) => {
  res.send("we are in ");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`we are in port ${PORT}`);
});
