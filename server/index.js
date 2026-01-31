const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { readdirSync } = require("fs");
const morgan = require("morgan");
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// loop router
readdirSync("./routes").map((r) => app.use('/',require('./routes/' + r)));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
