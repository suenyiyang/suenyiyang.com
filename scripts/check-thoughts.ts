import { readThoughts } from "../config/thoughts";

const notes = readThoughts();
console.log(`Thoughts checked: ${notes.length} published notes.`);
