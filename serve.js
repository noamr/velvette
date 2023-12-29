const express = require('express')
const app = express()
const port = process.env["PORT"] ?? 3000;

app.use("/", express.static("."));
app.listen(port, () => {
  console.log(`Static files served on port ${port}`)
})