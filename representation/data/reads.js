/* Read it cards: short, simple texts about a media text, using target words, then one question.

   Mark each target word in the text as [[shown text|word id]]. Students can tap it to see its meaning
   (and its Chinese, when 中文 is on). Keep the English simple (A1/A2): short sentences, present tense.

     id     permanent ID
     lv     word set ("1", "2", "3")
     title  what the text is about
     text   3 or 4 sentences
     q      one question about the text
     opts   three answers; a = the right one
*/
window.PRACTICE = window.PRACTICE || {};
window.PRACTICE.READS = [
  { id: "r:perfume", lv: "1", title: "A perfume advert",
    text: "The advert shows a young woman in the [[foreground|cre:foreground]]. She is wearing a gold dress. The [[lighting|cre:lighting]] is soft and warm. The [[colour|cre:colour]] gold [[suggests|verb:suggest]] that she is [[wealthy|des:wealthy]].",
    q: "What does the gold colour suggest?", opts: ["She is wealthy.", "She is vulnerable.", "She is serious."], a: 0 },
  { id: "r:footballer", lv: "1", title: "A sports poster",
    text: "The poster shows a footballer. The [[camera angle|cre:cameraangle]] is low, so he looks [[powerful|des:powerful]]. His [[facial expression|cre:facialexpression]] is [[serious|des:serious]]. The [[slogan|cre:slogan]] says “Never stop”.",
    q: "Why does the footballer look powerful?", opts: ["Because of the low camera angle.", "Because of the slogan.", "Because he is smiling."], a: 0 },
  { id: "r:charity", lv: "1", title: "A charity advert",
    text: "The [[image|cre:image]] shows a small child alone in a dark street. The child looks cold and [[vulnerable|des:vulnerable]]. The dark [[lighting|cre:lighting]] [[creates|verb:create]] a sad mood. The [[purpose|acad:purpose]] of the advert is to make people give money.",
    q: "What is the purpose of the advert?", opts: ["To make people give money.", "To sell warm clothes.", "To show a happy family."], a: 0 },
  { id: "r:magazine", lv: "1", title: "A magazine cover",
    text: "The magazine cover shows a famous singer. Her [[pose|cre:pose]] is [[confident|des:confident]]: she has her hands on her hips. The [[headline|cre:headline]] is “Queen of Pop”. The [[target audience|rep:targetaudience]] is probably teenage girls.",
    q: "Who is the target audience?", opts: ["Probably teenage girls.", "Probably older men.", "Probably young children."], a: 0 },
  { id: "r:kitchen", lv: "1", title: "A family advert",
    text: "The advert shows a family in a kitchen. The mother is cooking and the father is reading. This is a [[traditional|rep:traditional]] [[representation|rep:representation]] of a family. Some people think it [[reinforces|verb:reinforce]] a [[stereotype|rep:stereotype]].",
    q: "What does the advert reinforce?", opts: ["A stereotype.", "A slogan.", "A close-up."], a: 0 },
  { id: "r:nurse", lv: "1", title: "A news photograph",
    text: "The photo shows a nurse in a hospital. Her [[facial expression|cre:facialexpression]] is kind and [[caring|des:caring]]. The [[headline|cre:headline]] describes her as a hero. This is a [[positive|rep:positive]] [[representation|rep:representation]] of nurses.",
    q: "How does the headline describe the nurse?", opts: ["As a hero.", "As weak.", "As a stereotype."], a: 0 },
  { id: "r:car", lv: "1", title: "A car advert",
    text: "The [[setting|cre:setting]] is a [[modern|des:modern]] city at night. A man in smart [[clothing|cre:clothing]] is driving an expensive car. He looks [[successful|des:successful]]. The advert [[suggests|verb:suggest]] that the car will make you successful too.",
    q: "What is the setting?", opts: ["A modern city at night.", "A small kitchen.", "A sunny beach."], a: 0 },
  { id: "r:phone", lv: "1", title: "A phone advert",
    text: "In the [[background|cre:background]], there is a busy street. In the [[foreground|cre:foreground]], a teenager is smiling at her phone. Her [[body language|cre:bodylanguage]] is relaxed and [[friendly|des:friendly]]. The bright colours [[create|verb:create]] a happy mood.",
    q: "What is in the background?", opts: ["A busy street.", "A teenager.", "A phone."], a: 0 },
  { id: "r:twoadverts", lv: "1", title: "Two sports adverts",
    text: "The first advert shows a [[strong|des:strong]] man lifting weights. The second advert shows a strong woman running. The second advert [[challenges|verb:challenge]] the [[stereotype|rep:stereotype]] that women are [[weak|des:weak]]. The first advert does not.",
    q: "Which advert challenges the stereotype?", opts: ["The second advert.", "The first advert.", "Both adverts."], a: 0 },
  { id: "r:closeup", lv: "1", title: "A close-up photo",
    text: "This image is a [[close-up|cre:closeup]] of an old man's face. We can see every [[detail|acad:detail]] of his skin. He is not smiling. The close-up helps the [[audience|rep:audience]] to feel sad for him.",
    q: "What can we see in the close-up?", opts: ["Every detail of his skin.", "His whole body.", "A busy city."], a: 0 },
  { id: "r:superhero", lv: "1", title: "A film poster",
    text: "The poster shows a superhero in a red [[costume|cre:costume]]. She is standing in front of a burning building. Her [[pose|cre:pose]] shows that she is brave and [[independent|des:independent]]. The [[language|cre:language]] on the poster is short and exciting.",
    q: "What colour is her costume?", opts: ["Red.", "Gold.", "Black."], a: 0 },
  { id: "r:howto", lv: "1", title: "How to analyse an image",
    text: "When you [[analyse|acad:analyse]] an image, look closely at the [[details|acad:detail]]. [[Identify|acad:identify]] the creative choices, such as colour and lighting. Then [[explain|acad:explain]] what each choice suggests. Use [[evidence|acad:evidence]] from the image to [[support|acad:support]] your ideas.",
    q: "What should you use to support your ideas?", opts: ["Evidence from the image.", "A slogan.", "Your favourite colour."], a: 0 },
  { id: "r:teens", lv: "1", title: "Teenagers in the news",
    text: "Many news stories show teenagers in a [[negative|rep:negative]] way. They show young people as lazy or angry. This is not [[realistic|rep:realistic]], because most teenagers are [[responsible|des:responsible]]. A better [[representation|rep:representation]] would show [[ordinary|rep:ordinary]] teenagers at school.",
    q: "Why is the representation not realistic?", opts: ["Most teenagers are responsible.", "Most teenagers are lazy.", "Teenagers do not read the news."], a: 0 },
  { id: "r:identity", lv: "1", title: "A football fan",
    text: "The photo shows a girl at a football match. Her [[clothing|cre:clothing]] is the team's colours, red and white. This shows her [[identity|rep:identity]] as a fan. She is part of a [[group|rep:group]], but she is also an [[individual|rep:individual]]: she is the only one holding a flag.",
    q: "What does her clothing show?", opts: ["Her identity as a fan.", "That she is a player.", "That she is cold."], a: 0 }
];
