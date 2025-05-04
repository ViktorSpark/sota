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
// Улучшенная генерация сот (охватывает весь видимый экран)
function generateHexagons() {
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const resolution = Math.min(5, Math.floor(zoom / 2)); // Автоподбор размера сот
  
  // Расширяем границы на 20% для полного покрытия
  const paddedBounds = {
    west: bounds.getWest() - 0.2 * (bounds.getEast() - bounds.getWest()),
    east: bounds.getEast() + 0.2 * (bounds.getEast() - bounds.getWest()),
    south: bounds.getSouth() - 0.2 * (bounds.getNorth() - bounds.getSouth()),
    north: bounds.getNorth() + 0.2 * (bounds.getNorth() - bounds.getSouth())
  };

  const hexagons = h3.polygonToCells([
    [
      [paddedBounds.west, paddedBounds.south],
      [paddedBounds.east, paddedBounds.south],
      [paddedBounds.east, paddedBounds.north],
      [paddedBounds.west, paddedBounds.north],
      [paddedBounds.west, paddedBounds.south]
    ]
  ], resolution);
  
  // Остальной код генерации...
}

// Остальной код (меню, 3D и т.д.) остаётся без изменений
