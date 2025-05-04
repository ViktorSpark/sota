// Инициализация карты с надежным источником тайлов
const map = new maplibregl.Map({
  container: 'map',
  style: {
    "version": 8,
    "sources": {
      "raster-tiles": {
        "type": "raster",
        "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        "tileSize": 256,
        "attribution": "© OpenStreetMap"
      }
    },
    "layers": [{
      "id": "osm-tiles",
      "type": "raster",
      "source": "raster-tiles",
      "minzoom": 0,
      "maxzoom": 19
    }]
  },
  center: [8.2275, 46.8182], // Швейцария
  zoom: 5
});

// Проверка загрузки карты
map.on('load', () => {
  console.log('Карта успешно загружена');
  generateHexagons();
  
  // Добавляем контроль масштаба для удобства
  map.addControl(new maplibregl.NavigationControl());
});

// Генерация сот с обработкой ошибок
function generateHexagons() {
  try {
    const bounds = map.getBounds();
    const hexagons = h3.polygonToCells([
      [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()],
        [bounds.getWest(), bounds.getNorth()],
        [bounds.getWest(), bounds.getSouth()]
      ]
    ], 4); // Уровень детализации

    const features = hexagons.map(hex => ({
      type: 'Feature',
      properties: { id: hex },
      geometry: {
        type: 'Polygon',
        coordinates: [h3.cellToBoundary(hex, true)]
      }
    }));

    if (map.getSource('hexagons')) {
      map.getSource('hexagons').setData({
        type: 'FeatureCollection',
        features: features
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
          'fill-opacity': 0.3,
          'fill-outline-color': '#FFFFFF'
        }
      });
    }
  } catch (error) {
    console.error('Ошибка генерации сот:', error);
  }
}

// Обработчики событий
map.on('moveend', generateHexagons);
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
