import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve(process.argv[2] ?? "preview");
const fit = `<script>
(function () {
  var eth = window.ethereum;
  if (eth && typeof eth.request === "function" && typeof eth.on === "function" && typeof eth.removeListener !== "function" && typeof eth.off === "function") {
    eth.removeListener = eth.off.bind(eth);
  }
  var root = document.documentElement;
  function fit() {
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    root.style.height = Math.round(height) + "px";
  }
  fit();
  window.addEventListener("resize", fit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fit);
    window.visualViewport.addEventListener("scroll", fit);
  }
})();
</script>`;

const indexPath = path.join(dir, "index.html");
const index = (await readFile(indexPath, "utf8"))
  .replace('content="width=device-width,initial-scale=1"', 'content="width=device-width, initial-scale=1, viewport-fit=cover"')
  .replace('<script src="./runtime.js"></script>', `${fit}<script src="./runtime.js"></script>`);
await writeFile(indexPath, index);

const gamePath = path.join(dir, "game.html");
const game = (await readFile(gamePath, "utf8")).replace(
  'content="width=device-width,initial-scale=1"',
  'content="width=device-width, initial-scale=1, viewport-fit=cover"',
);
await writeFile(gamePath, game);
