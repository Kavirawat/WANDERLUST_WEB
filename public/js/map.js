// maptilersdk.config.apiKey = mapToken;

// const map = new maptilersdk.Map({
//   container: "map",
//   style: maptilersdk.MapStyle.BASIC,
//   center: coordinates, // [lng, lat]
//   zoom: 8,
// });

// console.log(coordinates);
// const marker = new maptilersdk.Marker({ color: "red" })
//   .setLngLat(coordinates)
//   .addTo(map);
// Safety check
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
