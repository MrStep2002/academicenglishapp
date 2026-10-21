Golden 100 Word Games
=====================
Static page, no build step. Open english-games/index.html.

Fonts are stored in the repo (../fonts and ../css/fonts.css), so nothing loads from Google and the page works in mainland China.

Files
  index.html         the page
  fonts.css          Gloock and IBM Plex Mono, loaded from ../fonts
  styles.css         look and layout
  app.js             the six games
  data/words.js      the 100 words: definition, example, Chinese, synonym group, near-meaning family
  data/gaps.js       300 fill-the-gap sentences (3 per word)
  data/extracts.js   71 "In your own words" extracts, tagged by set (2-5)
  data/errors.js     40 Spot the error paragraphs, 8 per set (set 1 = analysis paragraphs, 2-5 = description)

Adding content
  Copy an existing line in the data file and follow the same pattern.
  Gap items:  [word id, "sentence with ___", "answer", ["wrong1","wrong2","wrong3"], "explanation"]
  Extracts:   {"s":set, "t":"text with [underlined] words", "ids":[word ids], "qs":[["right meaning",["wrong","wrong","wrong"]], ...]}
              Keep the right meaning about the same length as the wrong ones, so length doesn't give the answer away.
  Errors:     {s:set, title:"...", text:"... [wrong|right|why] ..."}
              Everything outside the brackets must be correct. A wrong part can be two words, e.g. [a ominous|an ominous|...].
