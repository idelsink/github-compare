import { gemoji } from "gemoji";

const emojis = {};

gemoji.forEach((item) => {
  item.names.forEach((name) => {
    emojis[name] = item.emoji;
  });
});
// Adding additional emojis that are not in here by default
emojis["hooray"] = emojis.tada;
emojis["laugh"] = emojis.smile;

// Emojis in format of:
// {
//   "name": "emoji",
// }
export default emojis;
