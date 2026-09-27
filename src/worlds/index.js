import { world as world1, lessons as lessons1 } from "./mundo1.js";
import { world as world2, lessons as lessons2 } from "./mundo2.js";
import { world as world3, lessons as lessons3 } from "./mundo3.js";
import { world as world4, lessons as lessons4 } from "./mundo4.js";

// Cada mundo se desbloquea al completar todas las lecciones del anterior.
export const worlds = [
  { world: world1, lessons: lessons1 },
  { world: world2, lessons: lessons2 },
  { world: world3, lessons: lessons3 },
  { world: world4, lessons: lessons4 },
];
