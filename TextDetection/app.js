const express = require("express");
const path = require("path");
const { router } = require("./routers");
const PORT = 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", router);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
