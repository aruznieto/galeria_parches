import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const CDN_URL = "https://cdn.anrn.dev/parches/";
const PATCHES_JSON_URL = `${CDN_URL}parches.json`;

/*
  parches.json debe estar en el CDN y puede tener una de estas formas:
  ["aga.webp", "otro-parche.png"]
  { "parches": ["aga.webp", "otro-parche.png"] }
  [{ "name": "EZAPAC", "img": "ezapac.webp" }]
*/

const FALLBACK_PATCHES = [
  {
    name: "aga",
    img: "aga.webp",
  },
];

const BOARD_PADDING = 26;

const PATCH = {
  minSize: 34,
  fillRatio: 0.88,
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function normalizePatchFiles(data) {
  const patches = Array.isArray(data) ? data : data?.parches;

  if (!Array.isArray(patches)) {
    return FALLBACK_PATCHES;
  }

  return patches
    .map((patch) => {
      if (typeof patch === "string") {
        return {
          name: patch.replace(/\.[^.]+$/, ""),
          img: patch,
        };
      }

      return {
        name: patch?.name || patch?.img || "parche",
        img: patch?.img,
      };
    })
    .filter((patch) => typeof patch.img === "string")
    .filter((patch) => /\.(png|webp|svg|jpg|jpeg|avif)$/i.test(patch.img));
}

async function loadPatchFiles() {
  try {
    const response = await fetch(PATCHES_JSON_URL);

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${PATCHES_JSON_URL}`);
    }

    const files = normalizePatchFiles(await response.json());
    return files.length > 0 ? files : FALLBACK_PATCHES;
  } catch (error) {
    console.error(error);
    return FALLBACK_PATCHES;
  }
}

function createPatch(patchData, index) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(index),
    name: patchData.name,
    file: patchData.img,
    src: `${CDN_URL}${patchData.img}`,
    x: BOARD_PADDING,
    y: BOARD_PADDING,
    w: PATCH.minSize,
    h: PATCH.minSize,
    rotation: randomBetween(-11, 11),
    lastSafeX: BOARD_PADDING,
    lastSafeY: BOARD_PADDING,
  };
}

function getBestGrid(count, boardSize) {
  const innerWidth = Math.max(1, boardSize.width - BOARD_PADDING * 2);
  const innerHeight = Math.max(1, boardSize.height - BOARD_PADDING * 2);
  const boardRatio = innerWidth / innerHeight;
  let bestGrid = {
    columns: count,
    rows: 1,
    size: PATCH.minSize,
    score: Infinity,
  };

  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const cellWidth = innerWidth / columns;
    const cellHeight = innerHeight / rows;
    const size = Math.max(
      PATCH.minSize,
      Math.floor(Math.min(cellWidth, cellHeight) * PATCH.fillRatio)
    );
    const gridRatio = columns / rows;
    const emptyCells = columns * rows - count;
    const score =
      Math.abs(gridRatio - boardRatio) * 100 +
      emptyCells * 12 -
      size;

    if (score < bestGrid.score) {
      bestGrid = {
        columns,
        rows,
        size,
        score,
      };
    }
  }

  return bestGrid;
}

function generateInitialLayout(patches, boardSize) {
  if (!boardSize || patches.length === 0) return [];

  const { columns, rows, size } = getBestGrid(patches.length, boardSize);
  const innerWidth = Math.max(1, boardSize.width - BOARD_PADDING * 2);
  const innerHeight = Math.max(1, boardSize.height - BOARD_PADDING * 2);
  const cellWidth = innerWidth / columns;
  const cellHeight = innerHeight / rows;

  return patches.map((patchData, index) => {
    const patch = createPatch(patchData, index);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = BOARD_PADDING + column * cellWidth + (cellWidth - size) / 2;
    const y = BOARD_PADDING + row * cellHeight + (cellHeight - size) / 2;

    return {
      ...patch,
      x,
      y,
      w: size,
      h: size,
      rotation: randomBetween(-8, 8),
      lastSafeX: x,
      lastSafeY: y,
    };
  });
}

function App() {
  const [patchFiles, setPatchFiles] = React.useState(FALLBACK_PATCHES);
  const [items, setItems] = React.useState([]);
  const [boardSize, setBoardSize] = React.useState(null);
  const [selectedPatch, setSelectedPatch] = React.useState(null);
  const boardRef = React.useRef(null);

  React.useEffect(() => {
    let isActive = true;

    loadPatchFiles().then((files) => {
      if (!isActive) return;

      setPatchFiles(files);
    });

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!boardRef.current) return undefined;

    const updateBoardSize = () => {
      const rect = boardRef.current.getBoundingClientRect();
      setBoardSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateBoardSize();

    const observer = new ResizeObserver(updateBoardSize);
    observer.observe(boardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!boardSize) return;

    setItems(generateInitialLayout(patchFiles, boardSize));
  }, [patchFiles, boardSize]);

  return (
    <main className="page">
      <section ref={boardRef} className="board">
        <div className="board-corner board-corner--tl" />
        <div className="board-corner board-corner--tr" />
        <div className="board-corner board-corner--bl" />
        <div className="board-corner board-corner--br" />

        {items.map((item, index) => {
          return (
            <img
              key={item.id}
              src={item.src}
              alt={item.name}
              className="patch"
              style={{
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                "--rotation": `${item.rotation}deg`,
              }}
              onClick={() => setSelectedPatch(item)}
              loading={index < 8 ? "eager" : "lazy"}
              fetchPriority={index < 4 ? "high" : "auto"}
              decoding="async"
              draggable={false}
              onError={(event) => {
                event.currentTarget.src = `https://placehold.co/120x120/111/fff?text=${encodeURIComponent(
                  item.name
                )}`;
              }}
            />
          );
        })}
      </section>

      {selectedPatch && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPatch.name}
          onClick={() => setSelectedPatch(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            aria-label="Cerrar"
            onClick={() => setSelectedPatch(null)}
          >
            x
          </button>
          <figure
            className="lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedPatch.src}
              alt={selectedPatch.name}
              className="lightbox-image"
            />
            <figcaption className="lightbox-title">
              {selectedPatch.name}
            </figcaption>
          </figure>
        </div>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
