const width = 800;
const height = 600;

const projection = d3.geoOrthographic()
  .scale(300)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath().projection(projection);

const svg = d3.select("#container")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

const globe = svg.append("path")
  .attr("fill", "#d6f0ff")
  .attr("stroke", "#999");

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
  const countries = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);

  globe.datum({ type: "Sphere" }).attr("d", path);

  svg.append("path")
    .datum(countries)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("d", path);

  // Animate globe rotation
  let λ = 0;
  const rotation = d3.timer((elapsed) => {
    λ = (elapsed * 0.02) % 360;
    projection.rotate([λ, -20]);
    svg.selectAll("path").attr("d", path);
  });

  // Zoom to USA after 3 seconds
  setTimeout(() => {
    rotation.stop();
    const usCentroid = [-98.5795, 39.8283];
    d3.transition()
      .duration(2000)
      .tween("rotate", () => {
        const r = d3.interpolate(projection.rotate(), [-usCentroid[0], -usCentroid[1]]);
        return (t) => {
          projection.rotate(r(t));
          svg.selectAll("path").attr("d", path);
        };
      });
  }, 3000);
});
