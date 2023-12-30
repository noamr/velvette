const express = require('express')
const app = express()
const port = process.env["PORT"] ?? 3000;
const path = require('path');
app.use("/src/", express.static("../../src"));
app.use("/assets/", express.static("./assets"));
app.get("/app/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "./index.html"));
});

app.get("/", (req, res) => res.redirect("/app/"));
app.listen(port, () => {
  console.log(`Example served on port ${port}`)
})