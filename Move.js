const canvas = document.getElementById('cartesianCanvas');
const ctx = canvas.getContext('2d');

// Configuración de la cuadrícula (-20 a 20 en ambos ejes)
const gridRange = 20;
const width = canvas.width;
const height = canvas.height;
const center = width / 2;
const scale = width / (gridRange * 2); // 13px por unidad

// Elementos del DOM
const shapeSelect = document.getElementById('shapeSelect');
const initXInput = document.getElementById('initX');
const initYInput = document.getElementById('initY');
const btnPlace = document.getElementById('btnPlace');
const transXInput = document.getElementById('transX');
const transYInput = document.getElementById('transY');
const rotAngleInput = document.getElementById('rotAngle');
const angleDisplay = document.getElementById('angleDisplay');
const btnReset = document.getElementById('btnReset');

const initialCoordsList = document.getElementById('initialCoordsList');
const finalCoordsList = document.getElementById('finalCoordsList');
const summaryTrans = document.getElementById('summaryTrans');
const summaryAngle = document.getElementById('summaryAngle');
const summaryCenter = document.getElementById('summaryCenter');

// Estado de la figura
let baseVertices = [];

// Generar vértices iniciales a partir del punto base (x, y)
function buildBaseShape() {
  const shape = shapeSelect.value;
  const x = parseFloat(initXInput.value) || 0;
  const y = parseFloat(initYInput.value) || 0;

  if (shape === 'square') {
    // Cuadrado de lado 5 unidades
    baseVertices = [
      { label: 'A', x: x, y: y },
      { label: 'B', x: x + 5, y: y },
      { label: 'C', x: x + 5, y: y + 5 },
      { label: 'D', x: x, y: y + 5 }
    ];
  } else {
    // Triángulo de base 6 y altura 6
    baseVertices = [
      { label: 'A', x: x, y: y },
      { label: 'B', x: x + 6, y: y },
      { label: 'C', x: x + 3, y: y + 6 }
    ];
  }
  updateAll();
}

// Calcular el centroide (centro geométrico) de un conjunto de vértices
function getCentroid(vertices) {
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length
  };
}

// Aplicar traslación y luego rotación sobre el propio eje (centroide) de la figura
function getTransformedData() {
  const dx = parseFloat(transXInput.value) || 0;
  const dy = parseFloat(transYInput.value) || 0;
  const angleDeg = parseFloat(rotAngleInput.value) || 0;
  const rad = (angleDeg * Math.PI) / 180;

  // 1. Aplicar traslación primero
  const translatedVertices = baseVertices.map(v => ({
    label: v.label,
    x: v.x + dx,
    y: v.y + dy
  }));

  // 2. Obtener el centro propio de la figura ya trasladada
  const pivot = getCentroid(translatedVertices);

  // 3. Rotar cada vértice alrededor del centroide (pivot)
  const rotatedVertices = translatedVertices.map(v => {
    const relX = v.x - pivot.x;
    const relY = v.y - pivot.y;

    const rx = pivot.x + (relX * Math.cos(rad) - relY * Math.sin(rad));
    const ry = pivot.y + (relX * Math.sin(rad) + relY * Math.cos(rad));

    return {
      label: v.label + "'",
      x: Number(rx.toFixed(2)),
      y: Number(ry.toFixed(2))
    };
  });

  return {
    vertices: rotatedVertices,
    pivot: {
      x: Number(pivot.x.toFixed(2)),
      y: Number(pivot.y.toFixed(2))
    }
  };
}

// Convertir coordenadas cartesianas a píxeles del canvas
function toCanvasX(x) {
  return center + x * scale;
}

function toCanvasY(y) {
  return center - y * scale;
}

// Dibujar el plano cartesiano (-20 a 20)
function drawGrid() {
  ctx.clearRect(0, 0, width, height);

  for (let i = -gridRange; i <= gridRange; i++) {
    ctx.strokeStyle = i === 0 ? '#1c2833' : (i % 5 === 0 ? '#d5dbdb' : '#f0f3f4');
    ctx.lineWidth = i === 0 ? 2 : 1;

    // Líneas verticales
    ctx.beginPath();
    ctx.moveTo(toCanvasX(i), 0);
    ctx.lineTo(toCanvasX(i), height);
    ctx.stroke();

    // Líneas horizontales
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(i));
    ctx.lineTo(width, toCanvasY(i));
    ctx.stroke();

    // Números cada 4 unidades para mantener claridad visual
    if (i !== 0 && i % 4 === 0) {
      ctx.fillStyle = '#566573';
      ctx.font = '10px sans-serif';
      ctx.fillText(i, toCanvasX(i) - 7, center + 13);
      ctx.fillText(i, center + 5, toCanvasY(i) + 3);
    }
  }

  // Etiquetas de ejes X e Y
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('X', width - 15, center - 8);
  ctx.fillText('Y', center + 8, 15);
}

// Dibujar un polígono en el canvas
function drawPolygon(vertices, fillColor, strokeColor, isDashed = false) {
  if (vertices.length === 0) return;

  ctx.save();
  ctx.beginPath();
  if (isDashed) ctx.setLineDash([5, 5]);

  vertices.forEach((v, idx) => {
    const cx = toCanvasX(v.x);
    const cy = toCanvasY(v.y);
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });

  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
  ctx.restore();

  // Dibujar puntos y etiquetas de los vértices
  vertices.forEach(v => {
    const cx = toCanvasX(v.x);
    const cy = toCanvasY(v.y);

    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    ctx.fillStyle = '#1c2833';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${v.label}(${v.x}, ${v.y})`, cx + 5, cy - 5);
  });
}

// Dibujar el punto del eje de rotación en el centro de la figura
function drawPivot(pivot) {
  const cx = toCanvasX(pivot.x);
  const cy = toCanvasY(pivot.y);

  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#f1c40f';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#9a7d0a';
  ctx.stroke();
}

// Actualizar listas de coordenadas en el panel derecho
function updatePanels(transformedData) {
  const dx = parseFloat(transXInput.value) || 0;
  const dy = parseFloat(transYInput.value) || 0;
  const angle = parseFloat(rotAngleInput.value) || 0;

  angleDisplay.textContent = angle;
  summaryTrans.textContent = `(${dx}, ${dy})`;
  summaryAngle.textContent = `${angle}°`;
  summaryCenter.textContent = `(${transformedData.pivot.x}, ${transformedData.pivot.y})`;

  initialCoordsList.innerHTML = baseVertices
    .map(v => `<li>${v.label} = (${v.x}, ${v.y})</li>`)
    .join('');

  finalCoordsList.innerHTML = transformedData.vertices
    .map(v => `<li>${v.label} = (${v.x}, ${v.y})</li>`)
    .join('');
}

// Renderizado general
function updateAll() {
  const transformedData = getTransformedData();
  drawGrid();
  drawPolygon(baseVertices, 'rgba(30, 132, 73, 0.22)', '#1e8449', true);
  drawPolygon(transformedData.vertices, 'rgba(192, 57, 43, 0.45)', '#922b21', false);
  drawPivot(transformedData.pivot);
  updatePanels(transformedData);
}

// Eventos
btnPlace.addEventListener('click', buildBaseShape);
shapeSelect.addEventListener('change', buildBaseShape);
transXInput.addEventListener('input', updateAll);
transYInput.addEventListener('input', updateAll);
rotAngleInput.addEventListener('input', updateAll);

btnReset.addEventListener('click', () => {
  initXInput.value = 2;
  initYInput.value = 2;
  transXInput.value = 0;
  transYInput.value = 0;
  rotAngleInput.value = 0;
  buildBaseShape();
});

// Crear copos de nieve animados en el fondo
function createSnowflakes() {
  const snowflakeCount = 25;
  for (let i = 0; i < snowflakeCount; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = '❄';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.animationDuration = (Math.random() * 5 + 5) + 's';
    flake.style.animationDelay = Math.random() * 5 + 's';
    flake.style.fontSize = (Math.random() * 10 + 12) + 'px';
    document.body.appendChild(flake);
  }
}

// Inicializar
createSnowflakes();
buildBaseShape();
