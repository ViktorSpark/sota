// Конфигурация карты (проекция Natural Earth)
const map = new maplibregl.Map({
  container: 'map',
  style: {
    "version": 8,
    "sources": {
      "natural-earth": {
        "type": "raster",
        "tiles": ["https://naturalearthtiles.org/{z}/{x}/{y}.png"],
        "tileSize": 256,
        "attribution": "© Natural Earth"
      }
    },
    "layers": [{
      "id": "nat-earth-layer",
      "type": "raster",
      "source": "natural-earth",
      "minzoom": 0,
      "maxzoom": 8
    }]
  },
  center: [8.2275, 46.8182], // Швейцария
  zoom: 5,
  maxZoom: 8,
  minZoom: 2
});

// Оптимизация генерации сот
let hexagonCache = {};
let currentResolution = 0;

function generateHexagons() {
  const zoom = map.getZoom();
  const resolution = Math.min(5, Math.max(2, Math.floor(zoom / 1.5)));
  
  // Кэширование для избежания перерисовки
  if (resolution === currentResolution) return;
  currentResolution = resolution;
  
  const bounds = map.getBounds();
  const hexagons = h3.polygonToCells([
    [
      [bounds.getWest() - 1, bounds.getSouth() - 1],
      [bounds.getEast() + 1, bounds.getSouth() - 1],
      [bounds.getEast() + 1, bounds.getNorth() + 1],
      [bounds.getWest() - 1, bounds.getNorth() + 1],
      [bounds.getWest() - 1, bounds.getSouth() - 1]
    ]
  ], resolution);

  // Фильтрация уже отрисованных сот
  const newHexagons = hexagons.filter(h => !hexagonCache[h]);
  
  // Подготовка GeoJSON
  const features = newHexagons.map(hex => {
    hexagonCache[hex] = true;
    return {
      type: 'Feature',
      properties: { id: hex },
      geometry: {
        type: 'Polygon',
        coordinates: [h3.cellToBoundary(hex, true)]
      }
    };
  });

  // Обновление слоя
  if (map.getSource('hexagons')) {
    const oldData = map.getSource('hexagons')._data.features;
    map.getSource('hexagons').setData({
      type: 'FeatureCollection',
      features: [...oldData, ...features]
    });
  } else {
    map.addSource('hexagons', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });
    
    map.addLayer({
      id: 'hexagons',
      type: 'fill',
      source: 'hexagons',
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.2,
        'fill-outline-color': '#FFFFFF',
      }
    });
  }
}

// Клик по соте
map.on('click', 'hexagons', (e) => {
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`Сота ID: <strong>${e.features[0].properties.id}</strong>`)
    .addTo(map);
});

// Заглушки меню
document.getElementById('btn-buy').addEventListener('click', () => alert('Функция "Купить соту" в разработке'));
document.getElementById('btn-editor').addEventListener('click', () => alert('3D-редактор появится позже'));
document.getElementById('btn-data').addEventListener('click', () => alert('Интеграция с данными планируется'));

// Инициализация
map.on('load', () => {
  generateHexagons();
  map.on('moveend', generateHexagons);
});
