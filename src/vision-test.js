/**
 * @typedef {object} LabelDetection
 * @property {string} label
 * @property {number} score
 * @property {string} translate
 */

/**
 * @typedef {object} ObjectDetection
 * @property {string} name
 * @property {number} score
 * @property {number[][]} bbox
 * @property {string} translate
 */

let fileIndex = 0;

const fileNames = [
  "cat_80_01",
  "cat_160_01",
  "cat_320_01",
  "cat_640_01",
  "cat_1280_01",
  "cat_1920_01",
  "dogs_80_01",
  "dogs_160_01",
  "dogs_320_01",
  "dogs_640_01",
  "dogs_1280_01",
  "dogs_1920_01",
  "fruits_80_01",
  "fruits_160_01",
  "fruits_320_01",
  "fruits_640_01",
  "fruits_1280_01",
  "fruits_1920_01",
  "fruits_80_02",
  "fruits_160_02",
  "fruits_320_02",
  "fruits_640_02",
  "fruits_1280_02",
  "fruits_1920_02",
  "japan_80_01",
  "japan_160_01",
  "japan_320_01",
  "japan_640_01",
  "japan_1280_01",
  "japan_1920_01",
  "monkey_80_01",
  "monkey_160_01",
  "monkey_320_01",
  "monkey_640_01",
  "monkey_1280_01",
  "monkey_1920_01",
  "owl_80_01",
  "owl_160_01",
  "owl_320_01",
  "owl_640_01",
  "owl_1280_01",
  "owl_1920_01",
  "paprika_80_01",
  "paprika_160_01",
  "paprika_320_01",
  "paprika_640_01",
  "paprika_1280_01",
  "paprika_1920_01",
  "penguins_80_01",
  "penguins_160_01",
  "penguins_320_01",
  "penguins_640_01",
  "penguins_1280_01",
  "penguins_1920_01",
  "people_80_01",
  "people_160_01",
  "people_320_01",
  "people_640_01",
  "people_1280_01",
  "people_1920_01",
  "pets_80_01",
  "pets_160_01",
  "pets_320_01",
  "pets_640_01",
  "pets_1280_01",
  "pets_1920_01",
  "rickshaw_80_01",
  "rickshaw_160_01",
  "rickshaw_320_01",
  "rickshaw_640_01",
  "rickshaw_1280_01",
  "rickshaw_1920_01",
  "salad_80_01",
  "salad_160_01",
  "salad_320_01",
  "salad_640_01",
  "salad_1280_01",
  "salad_1920_01",
  "still-life_80_01",
  "still-life_160_01",
  "still-life_320_01",
  "still-life_640_01",
  "still-life_1280_01",
  "still-life_1920_01",
  "wines_80_01",
  "wines_160_01",
  "wines_320_01",
  "wines_640_01",
  "wines_1280_01",
  "wines_1920_01",
];

/** @type {HTMLElement[]} */
const elementStack = [];

function clear() {
  const overlayCover = document.getElementById("overlayCover");
  const overlayCanvas = document.getElementById("overlayCanvas");

  while (overlayCanvas?.firstChild) {
    overlayCanvas.removeChild(overlayCanvas.lastChild);
  }

  while (overlayCover?.firstChild) {
    overlayCover.removeChild(overlayCover.lastChild);
  }

  while (elementStack.length) {
    elementStack.pop()?.remove();
  }
}

function getData(indexMove) {
  clear();

  fileIndex = fileIndex + indexMove;

  if (fileIndex < 0) fileIndex = 0;
  if (fileIndex > fileNames.length - 1) fileIndex = fileNames.length - 1;

  document.getElementById("image-info").innerText = fileNames[fileIndex];

  Promise.all([getImage(), getJson()]).then((results) =>
    build(JSON.parse(results[1]))
  );
}

function getImage() {
  const name = fileNames[fileIndex];
  const img = document.getElementById("img");

  return new Promise((ok) => {
    img.onload = () => ok();
    img.src = `./images/${name}.jpg`;
  });
}

function getJson() {
  const name = fileNames[fileIndex];
  const url = `./annotations/${name}.json`;
  const xmlHttp = new XMLHttpRequest();

  return new Promise((ok) => {
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        if (xmlHttp.response) ok(xmlHttp.response);
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
  });
}

/**
 * @param {string} tag
 * @return {HTMLElement}
 */
function newHTMLElemet(tag) {
  const ele = document.createElement(tag);
  elementStack.push(ele);
  return ele;
}

async function build(annotations) {
  const parent = document.getElementById("image-view");
  const target = document.getElementById("img");
  const overlayCover = newHTMLElemet("div");
  const overlayCanvas = newHTMLElemet("div");

  const style = window.getComputedStyle(target);

  overlayCover.id = "overlayCover";
  overlayCover.style.width = style.width;
  overlayCover.style.height = style.height;
  overlayCover.style.margin = style.margin;
  overlayCover.style.position = "absolute";

  overlayCanvas.id = "overlayCanvas";
  overlayCanvas.style.width = style.width;
  overlayCanvas.style.height = style.height;
  overlayCanvas.style.position = "relative";

  await buildBoundBox(overlayCanvas, annotations.object);

  overlayCover.appendChild(overlayCanvas);
  parent.appendChild(overlayCover);

  buildTagList(annotations);
}

function buildBoundBox(canvas, annotations) {
  return new Promise((ok) => {
    /** @type {ObjectDetection[]} */ const objects = annotations;
    for (const obj of objects) {
      const id = `obj_${obj.name}_${obj.score}`;
      const minX = obj.bbox[0][0];
      const minY = obj.bbox[0][1];
      const maxX = obj.bbox[2][0];
      const maxY = obj.bbox[2][1];

      const bbox = newHTMLElemet("div");
      const span = newHTMLElemet("span");
      bbox.classList.add("bbox");
      bbox.id = id;
      bbox.style.position = "absolute";
      bbox.style.left = `${minX * 100}%`;
      bbox.style.top = `${minY * 100}%`;
      bbox.style.width = `${(maxX - minX) * 100}%`;
      bbox.style.height = `${(maxY - minY) * 100}%`;

      span.innerText = `${obj.name}_${Math.round(obj.score * 100)}`;

      bbox.appendChild(span);
      canvas.appendChild(bbox);
    }
    ok();
  });
}

function buildTagList(annotations) {
  const labelUList = document.getElementById("label-list");
  const objectUList = document.getElementById("object-list");
  const labelCount = document.getElementById("label-count");
  const objctCount = document.getElementById("object-count");

  /** @type {LabelDetection[]} */ const labels = annotations?.label;
  /** @type {ObjectDetection[]} */ const objects = annotations?.object;

  labelCount.innerText = ` [${labels.length}]`;
  objctCount.innerText = ` [${objects.length}]`;

  for (const label of labels) {
    const li = newHTMLElemet("li");
    const text = `${label.translate}(${label.label}):${label.score}`;
    li.innerText = text;
    labelUList.appendChild(li);
  }

  for (const obj of objects) {
    const li = newHTMLElemet("li");
    const text = `${obj.translate}(${obj.name}):${obj.score}`;
    li.innerText = text;
    objectUList.appendChild(li);
  }
}

window.onload = function () {
  getData(0);
  document.getElementById("previous-image").onclick = () => getData(-1);
  document.getElementById("next-image").onclick = () => getData(1);
};
