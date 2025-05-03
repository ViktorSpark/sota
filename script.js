mapboxgl.accessToken = 'ваш_токен_mapbox'; // Замените на свой токен!

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [8.2275, 46.8182], // Швейцария
  zoom: 7,
  pitch: 0
});

let is3D = false;

// Переключение 2D/3D
document.getElementById('toggle-3d').addEventListener('click', () => {
  is3D = !is3D;
  map.setPitch(is3D ? 60 : 0);
  document.getElementById('toggle-3d').textContent = is3D ? '2D' : '3D';
});

// Генерация шестиугольников (H3)
function generateHexagons() {
  const bounds = map.getBounds();
  const hexagons = h3.polygonToCells([
    [
      [bounds.getWest(), bounds.getSouth()],
      [bounds.getEast(), bounds.getSouth()],
      [bounds.getEast(), bounds.getNorth()],
      [bounds.getWest(), bounds.getNorth()],
      [bounds.getWest(), bounds.getSouth()]
    ]
  ], 7); // Уровень детализации (7 для Швейцарии)

  // Добавление GeoJSON слоя
  const hexagonFeatures = hexagons.map(hex => {
    const coordinates = h3.cellToBoundary(hex, true);
    return {
      type: 'Feature',
      properties: { id: hex },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  });

  if (map.getLayer('hexagons')) {
    map.getSource('hexagons').setData({
      type: 'FeatureCollection',
      features: hexagonFeatures
    });
  } else {
    map.addLayer({
      id: 'hexagons',
      type: 'fill',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hexagonFeatures
        }
      },
      paint: {
        'fill-color': '#888888',
        'fill-opacity': 0.3,
        'fill-outline-color': '#ff0000'
      }
    });
  }
}

// Клик по соте
map.on('click', 'hexagons', (e) => {
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`Сота ID: <strong>${e.features[0].properties.id}</strong>`)
    .addTo(map);
});

// Загрузка карты
map.on('load', () => {
  generateHexagons();
  map.on('moveend', generateHexagons);
});

// Заглушки для меню
document.getElementById('btn-buy').addEventListener('click', () => alert('Функция "Купить соту" в разработке'));
document.getElementById('btn-editor').addEventListener('click', () => alert('3D-редактор появится позже'));
document.getElementById('btn-data').addEventListener('click', () => alert('Интеграция с данными планируется'));
