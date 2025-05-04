// Конфигурация карты
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // Бесплатный стиль
  center: [8.2275, 46.8182], // Швейцария
  zoom: 7,
  pitch: 0 // Начальный 2D-режим
});

let is3D = false;

// Переключение 2D/3D
document.getElementById('toggle-3d').addEventListener('click', () => {
  is3D = !is3D;
  map.setPitch(is3D ? 45 : 0);
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

  // Создание GeoJSON слоя
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

  // Добавление слоя на карту
  if (map.getLayer('hexagons')) {
    map.getSource('hexagons').setData({
      type: 'FeatureCollection',
      features: hexagonFeatures
    });
  } else {
    map.addSource('hexagons', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: hexagonFeatures
      }
    });

    map.addLayer({
      id: 'hexagons',
      type: 'fill',
      source: 'hexagons',
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.2,
        'fill-outline-color': '#FF0000'
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

// Инициализация
map.on('load', () => {
  generateHexagons();
  map.on('moveend', generateHexagons);
});

// Заглушки для меню
document.getElementById('btn-buy').addEventListener('click', () => alert('Функция "Купить соту" в разработке'));
document.getElementById('btn-editor').addEventListener('click', () => alert('3D-редактор появится позже'));
document.getElementById('btn-data').addEventListener('click', () => alert('Интеграция с данными планируется'));
