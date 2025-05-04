// Инициализация карты
const map = new maplibregl.Map({
  container: 'map',
  style: {
    "version": 8,
    "sources": {
      "osm-tiles": {
        "type": "raster",
        "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        "tileSize": 256,
        "attribution": "© OpenStreetMap"
      }
    },
    "layers": [{
      "id": "osm-layer",
      "type": "raster",
      "source": "osm-tiles",
      "minzoom": 0,
      "maxzoom": 19
    }]
  },
  center: [8.2275, 46.8182],
  zoom: 7
});

// Параметры отрисовки
const HEX_RADIUS = 5; // Количество колец сот вокруг курсора
let currentHexes = new Set();
let cursorLngLat = null;

// Инициализация слоя сот
function initHexLayer() {
  if (!map.getSource('hexagons')) {
    map.addSource('hexagons', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    
    map.addLayer({
      id: 'hexagons',
      type: 'fill',
      source: 'hexagons',
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.4,
        'fill-outline-color': '#FFFFFF'
      }
    });
  }
}

// Генерация сот вокруг точки
function generateHexesAroundPoint(lngLat) {
  const centerHex = h3.latLngToCell(lngLat.lat, lngLat.lng, 7);
  const hexes = h3.gridDisk(centerHex, HEX_RADIUS);
  
  const newHexes = new Set(hexes);
  const toRemove = [...currentHexes].filter(h => !newHexes.has(h));
  const toAdd = [...newHexes].filter(h => !currentHexes.has(h));
  
  // Обновляем текущий набор сот
  currentHexes = newHexes;
  
  // Получаем текущие данные
  const source = map.getSource('hexagons');
  const features = source._data.features || [];
  
  // Удаляем старые соты
  const updatedFeatures = features.filter(f => !toRemove.includes(f.properties.id));
  
  // Добавляем новые соты
  toAdd.forEach(hex => {
    updatedFeatures.push({
      type: 'Feature',
      properties: { id: hex },
      geometry: {
        type: 'Polygon',
        coordinates: [h3.cellToBoundary(hex, true)]
      }
    });
  });
  
  // Обновляем источник
  source.setData({
    type: 'FeatureCollection',
    features: updatedFeatures
  });
  
  // Обновляем информацию о курсоре
  document.getElementById('cursor-info').textContent = 
    `Текущие координаты: ${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}`;
}

// Отслеживание движения мыши
map.on('mousemove', (e) => {
  cursorLngLat = e.lngLat;
  generateHexesAroundPoint(e.lngLat);
});

// Клик по соте
map.on('click', 'hexagons', (e) => {
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`Сота ID: <strong>${e.features[0].properties.id}</strong>`)
    .addTo(map);
});

// Инициализация
map.on('load', () => {
  initHexLayer();
  map.addControl(new maplibregl.NavigationControl());
  
  // Стартовая отрисовка в центре
  generateHexesAroundPoint({ lng: 8.2275, lat: 46.8182 });
});

// Заглушки меню
document.getElementById('btn-buy').addEventListener('click', () => {
  if (!cursorLngLat) return;
  alert(`Покупка соты по координатам: ${cursorLngLat.lng.toFixed(4)}, ${cursorLngLat.lat.toFixed(4)}`);
});
document.getElementById('btn-editor').addEventListener('click', () => alert('3D-редактор появится позже'));
document.getElementById('btn-data').addEventListener('click', () => alert('Интеграция с данными планируется'));
