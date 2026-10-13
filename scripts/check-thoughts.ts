import { readThoughts } from "../config/thoughts";
const notes = readThoughts();
console.log(
  `Thoughts checked: ${notes.length} published notes, ${
    new Set(notes.map((note) => note.thread ?? note.id)).size
  } threads.`
);
