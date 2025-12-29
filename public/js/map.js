
if (
  typeof mapToken !== "undefined" &&
  Array.isArray(coordinates) &&
  coordinates.length === 2
) {
  maptilersdk.config.apiKey = mapToken;

  const map = new maptilersdk.Map({
    container: "map",
    style: maptilersdk.MapStyle.BASIC,
    center: coordinates, // [lng, lat]
    zoom: 7,
  });

  new maptilersdk.Marker({ color: "red" }).setLngLat(coordinates).addTo(map);
}
