const fs = require("fs");
const spin = require("./spin.js");

function dataUrl(file) {
  const data = fs.readFileSync("src/" + file).toString("base64");

  let type = "image/webp";
  if (file.endsWith(".woff2")) type = "font/woff2";
  if (file.endsWith(".svg")) type = "image/svg+xml";

  return "data:" + type + ";base64," + data;
}

function load(name) {
  let svg = fs.readFileSync("src/" + name, "utf8");

  for (const file of fs.readdirSync("src")) {
    if (svg.includes("{{" + file + "}}")) {
      svg = svg.split("{{" + file + "}}").join(dataUrl(file));
    }
  }

  return svg;
}

async function getStars(repo) {
  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
  }

  const res = await fetch("https://api.github.com/repos/roschreiber/" + repo, { headers });
  if (!res.ok) {
    throw new Error("github said " + res.status + " for " + repo);
  }

  const data = await res.json();
  if (data.stargazers_count >= 1000) {
    return (data.stargazers_count / 1000).toFixed(1) + "k";
  }
  return data.stargazers_count;
}

async function main() {
  fs.mkdirSync("assets", { recursive: true });

  const hero = load("hero.svg").split("{{logo}}").join(spin.logo(30, 40));
  fs.writeFileSync("assets/hero.svg", hero);

  const stars = await getStars("OhTheDungeon-Redux");
  const otd = load("card-otd.svg").split("{{stars}}").join(stars);
  fs.writeFileSync("assets/card-otd.svg", otd);

  fs.writeFileSync("assets/card-portfolio.svg", load("card-portfolio.svg"));

  console.log("done! otd-redux has " + stars + " stars");
}

main();
