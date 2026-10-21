Golden 100 Word Games
=====================
Upload this whole folder to any static web host (school website, GitHub Pages, Netlify).
Open index.html to play. No server or database is needed.

Files
  index.html         the page
  styles.css         look and layout
  app.js             the five games
  data/words.js      the 100 words: definition, example, Chinese, synonym group, near-meaning family
  data/gaps.js       300 fill-the-gap sentences (3 per word)
  data/extracts.js   71 "In your own words" extracts, tagged by set (2-5)

Adding content
  Copy an existing line in the data file and follow the same pattern.
  Gap items:  [word id, "sentence with ___", "answer", ["wrong1","wrong2","wrong3"], "explanation"]
  Extracts:   {"s":set, "t":"text with [underlined] words", "ids":[word ids], "qs":[["right meaning",["wrong","wrong","wrong"]], ...]}
  Keep the right meaning about the same length as the wrong ones, so length doesn't give the answer away.

Fonts load from Google Fonts; if that is blocked, the page falls back to system fonts and still works.
