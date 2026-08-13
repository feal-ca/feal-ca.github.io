// Photography. Images are imported from src/assets so Astro can generate
// responsive AVIF/WebP variants; never reference them from public/.
//
// `alt` describes what is in the frame, for screen readers and for anyone on
// a slow connection. `title` is the caption shown under the image.
//
// `place` is shown beside the year in the gallery and the lightbox. The
// source files carry no location metadata; these come from Ferran directly.

import canalAtDusk from "../assets/photography/canal-at-dusk.jpg";
import carvedMedallion from "../assets/photography/carved-medallion.jpg";
import churchAtDusk from "../assets/photography/church-at-dusk.jpg";
import courtyardHouse from "../assets/photography/courtyard-house.jpg";
import domeAndPines from "../assets/photography/dome-and-pines.jpg";
import ducklings from "../assets/photography/ducklings.jpg";
import gull from "../assets/photography/gull.jpg";
import islandChurch from "../assets/photography/island-church.jpg";
import mausoleumSquare from "../assets/photography/mausoleum-square.jpg";
import modernistTower from "../assets/photography/modernist-tower.jpg";
import moonOverStairs from "../assets/photography/moon-over-stairs.jpg";
import mosqueAtGoldenHour from "../assets/photography/mosque-at-golden-hour.jpg";
import pomegranates from "../assets/photography/pomegranates.jpg";
import psyche from "../assets/photography/psyche.jpg";
import rider from "../assets/photography/rider.jpg";
import roofGuardians from "../assets/photography/roof-guardians.jpg";
import shoreline from "../assets/photography/shoreline.jpg";
import waveAndBird from "../assets/photography/wave-and-bird.jpg";

export const photos = [
  {
    src: pomegranates,
    title: "Split pomegranates",
    year: 2026,
    place: "Alhambra, Granada",
    alt: "Burst pomegranates hanging from bare winter branches, seeds exposed against a white sky.",
  },
  {
    src: shoreline,
    title: "Shoreline",
    year: 2026,
    place: "Azores, Portugal",
    alt: "A steep beach seen from above: turquoise water breaking in a long white line against dark grey shingle, with a few tiny figures on the sand.",
    feature: true,
  },
  {
    src: domeAndPines,
    title: "Tiled dome",
    year: 2026,
    place: "Nice, France",
    alt: "A belle époque building with a tiled purple dome and a small colonnaded turret, framed by bare branches and a pine.",
  },
  {
    src: gull,
    title: "Gull over the hillside",
    year: 2026,
    place: "Azores, Portugal",
    alt: "A gull in flight with wings fully spread, passing in front of a wooded hillside and a stone wall.",
  },
  {
    src: mosqueAtGoldenHour,
    title: "Minarets at golden hour",
    year: 2025,
    place: "Tirana, Albania",
    alt: "A large stone mosque with a central dome and three slender minarets, lit gold by low evening sun beneath heavy blue clouds.",
    feature: true,
  },
  {
    src: canalAtDusk,
    title: "Canal at dusk",
    year: 2025,
    place: "Amsterdam, Netherlands",
    alt: "A narrow canal running dead straight into the distance between lines of dark trees, its surface catching the last light of the sky.",
  },
  {
    src: moonOverStairs,
    title: "Moon over the stairs",
    year: 2025,
    place: "Tirana, Albania",
    alt: "A gibbous moon in a clear pale blue sky above the concrete steps and metal railings of an exterior staircase.",
  },
  {
    src: churchAtDusk,
    title: "Church at dusk",
    year: 2025,
    place: "Azores, Portugal",
    alt: "A white baroque church with dark volcanic stone detailing and a bell tower, photographed at dusk.",
  },
  {
    src: waveAndBird,
    title: "Wave and bird",
    year: 2025,
    place: "Azores, Portugal",
    alt: "A small dark bird perched on a jagged volcanic rock as a wave explodes into white spray behind it.",
    feature: true,
  },
  {
    src: islandChurch,
    title: "Island church",
    year: 2025,
    place: "Lake Bled, Slovenia",
    alt: "A church with a tall steeple on a small wooded island in an alpine lake, framed between two trees, mountains behind.",
  },
  {
    src: ducklings,
    title: "Ducklings",
    year: 2025,
    place: "Lake Bled, Slovenia",
    alt: "A duck and two ducklings swimming in clear turquoise shallows over weed and pebbles.",
  },
  {
    src: modernistTower,
    title: "Modernist turret",
    year: 2025,
    place: "Barcelona, Spain",
    alt: "An ornate modernist apartment building with a tiled cupola and colonnaded turret, seen through bare winter branches; a bird crosses the top of the frame.",
  },
  {
    src: psyche,
    title: "Marble",
    year: 2025,
    place: "Musée du Louvre, Paris",
    alt: "A neoclassical marble sculpture of two embracing figures, one winged, lit softly against a plain wall.",
  },
  {
    src: roofGuardians,
    title: "Roof guardians",
    year: 2024,
    place: "China",
    alt: "The upturned eave of a temple roof in silhouette against deep blue twilight, a procession of small guardian figures along its ridge.",
    feature: true,
  },
  {
    src: carvedMedallion,
    title: "Carved medallion",
    year: 2024,
    place: "China",
    alt: "An intricately carved stone medallion set into a whitewashed wall above glazed roof tiles, partly obscured by leaves in the foreground.",
  },
  {
    src: rider,
    title: "The rider",
    year: 2024,
    place: "China",
    alt: "A bronze statue of an armoured rider on horseback holding a spear, against a clear sky with foliage at the edge of the frame.",
  },
  {
    src: courtyardHouse,
    title: "Courtyard house",
    year: 2024,
    place: "China",
    alt: "A white-walled house with dark upswept gables and latticed windows, a tall palm rising through the center of the frame.",
  },
  {
    src: mausoleumSquare,
    title: "The square",
    year: 2024,
    place: "Tiananmen Square, Beijing",
    alt: "A monumental hall with a red-tiled roof across a wide public square, a queue of visitors behind barriers and a sculptural group in front.",
  },
];

/** The handful used as banners elsewhere on the site. */
export const featured = photos.filter((p) => p.feature);

export default photos;
