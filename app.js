const express = require("express");
const path = require("path");
const app = express();

app
  .route([
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
  ])
  .all((_, res) => res.sendStatus(200));

app.route("/*").all((req, _, next) => {
  const obj = Object.assign({}, req.params, req.query, req.params);
  console.log([req.url, obj]);
  next();
});

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "./src/vision-test.html"))
);

app.get("/vision-test.css", (_, res) =>
  res.sendFile(path.join(__dirname, "./src/vision-test.css"))
);
app.get("/vision-test.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./src/vision-test.js"))
);

app.get("/images/:name.jpg", (req, res) => {
  res.sendFile(path.join(__dirname, `./images/${req.params.name}.jpg`));
});
app.get("/annotations/:name.json", (req, res) =>
  res.sendFile(path.join(__dirname, `./annotations/${req.params.name}.json`))
);

app.listen(32767, () => console.log("server on"));
