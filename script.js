const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [8.2275, 46.8182],
  zoom: 7,
  pitch: 0
});

let is3D = false;
let hoveredHexId = null;

// Инициализация карты
map.on('load', () => {
  initHexagonLayer();
  generateHexagons();
  
  map.on('moveend', () => {
    if (map.getZoom() > 4) generateHexagons();
  });
});

// Слой для сот
function initHexagonLayer() {
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
      'fill-opacity': 0.3,
      'fill-outline-color': '#FFFFFF'
    }
  });

  // Подсветка при наведении
  map.on('mousemove', 'hexagons', (e) => {
    if (e.features.length > 0) {
      if (hoveredHexId) {
        map.setFeatureState(
          { source: 'hexagons', id: hoveredHexId },
          { hover: false }
        );
      }
      hoveredHexId = e.features[0].id;
      map.setFeatureState(
        { source: 'hexagons', id: hoveredHexId },
        { hover: true }
      );
    }
  });
}

// Генерация сот
function generateHexagons() {
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const resolution = zoom > 10 ? 6 : 5; // Динамический размер
  
  const hexagons = h3.polygonToCells([
    [
      [bounds.getWest(), bounds.getSouth()],
      [bounds.getEast(), bounds.getSouth()],
      [bounds.getEast(), bounds.getNorth()],
      [bounds.getWest(), bounds.getNorth()],
      [bounds.getWest(), bounds.getSouth()]
    ]
  ], resolution);

  const features = hexagons.map(hex => ({
    type: 'Feature',
    properties: { id: hex },
    geometry: {
      type: 'Polygon',
      coordinates: [h3.cellToBoundary(hex, true)]
    }
  }));

  map.getSource('hexagons').setData({
    type: 'FeatureCollection',
    features: features
  });
}

// Остальной код (меню, 3D и т.д.) остаётся без изменений
