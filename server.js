 const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./db");
const app = require("./app");

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening at " + PORT));