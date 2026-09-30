import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve(process.argv[2] ?? "preview");
const version = process.argv[3] ?? "screen";
const fit = `<script>
(function () {
  var eth = window.ethereum;
  if (eth && typeof eth.request === "function" && typeof eth.on === "function" && typeof eth.removeListener !== "function" && typeof eth.off === "function") {
    eth.removeListener = eth.off.bind(eth);
  }
  function fit() {
    var viewport = window.visualViewport;
    var height = Math.round((viewport && viewport.height) || window.innerHeight);
    var width = Math.round((viewport && viewport.width) || window.innerWidth);
    document.documentElement.style.height = height + "px";
    document.body.style.height = height + "px";
    var nodes = document.querySelectorAll("#root, .rf-game-frame");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.position = "fixed";
      nodes[i].style.inset = "0px";
      nodes[i].style.width = width + "px";
      nodes[i].style.height = height + "px";
      nodes[i].style.maxWidth = "none";
    }
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fit);
    window.visualViewport.addEventListener("scroll", fit);
  }
  var ticks = 0;
  var timer = window.setInterval(function () {
    fit();
    if (++ticks > 20) window.clearInterval(timer);
  }, 250);
})();
</script>`;

function bust(html) {
  return html.replace(
    /(href|src)="\.\/([^"?]+)"/g,
    (_, attr, file) => `${attr}="./${file}?v=${version}"`,
  );
}

const indexPath = path.join(dir, "index.html");
let index = await readFile(indexPath, "utf8");
index = index.replace(
  'content="width=device-width,initial-scale=1"',
  'content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"',
);
index = index.replace('<script src="./runtime.js"></script>', `${fit}<script src="./runtime.js"></script>`);
await writeFile(indexPath, bust(index));

const gamePath = path.join(dir, "game.html");
let game = await readFile(gamePath, "utf8");
game = game.replace(
  'content="width=device-width,initial-scale=1"',
  'content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"',
);
await writeFile(gamePath, bust(game));
