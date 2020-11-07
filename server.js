const express = require("express");
const app = express();
const connectDB = require("./config/db");

//Connecting Data Base
connectDB();

//Init Middleware
app.use(express.json({ extended: false }));

//Main Get
app.get("/", (req, res) => {
	res.send("we are in ");
});

//Define Routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/auth", require("./routes/api/auth"));
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
	console.log(`we are in port ${PORT}`);
});
