// Fun names and easy passwords for new student accounts.
// Words are simple English, so the names and passwords are easy to read and type for A1/A2 learners.
'use strict';
const crypto = require('node:crypto');

const ADJECTIVES = ['Brave', 'Happy', 'Clever', 'Quick', 'Calm', 'Bright', 'Kind', 'Lucky', 'Sunny', 'Gentle', 'Bold', 'Swift',
  'Jolly', 'Proud', 'Cosmic', 'Golden', 'Silver', 'Mighty', 'Little', 'Busy', 'Cheerful', 'Curious', 'Daring', 'Eager', 'Fancy',
  'Friendly', 'Fuzzy', 'Grand', 'Honest', 'Merry', 'Noble', 'Polite', 'Quiet', 'Rapid', 'Smart', 'Steady', 'Super', 'Wise',
  'Zippy', 'Shiny', 'Cool', 'Royal', 'Magic', 'Stormy', 'Snowy', 'Electric', 'Turbo', 'Galactic', 'Epic'];
const ANIMALS = ['Panda', 'Tiger', 'Otter', 'Falcon', 'Koala', 'Dolphin', 'Fox', 'Owl', 'Penguin', 'Rabbit', 'Turtle', 'Eagle',
  'Lion', 'Whale', 'Zebra', 'Badger', 'Hedgehog', 'Squirrel', 'Lynx', 'Yak', 'Llama', 'Parrot', 'Gecko', 'Moose', 'Bison',
  'Camel', 'Cheetah', 'Dragon', 'Ferret', 'Gorilla', 'Hippo', 'Jaguar', 'Kangaroo', 'Lemur', 'Meerkat', 'Narwhal', 'Octopus',
  'Pelican', 'Puffin', 'Raccoon', 'Seal', 'Shark', 'Sloth', 'Swan', 'Toucan', 'Walrus', 'Wolf', 'Wombat', 'Phoenix', 'Unicorn'];
const PW_WORDS = ['apple', 'river', 'cloud', 'bread', 'chair', 'house', 'water', 'paper', 'music', 'garden', 'pencil', 'window',
  'table', 'orange', 'banana', 'rocket', 'planet', 'forest', 'island', 'castle', 'bridge', 'candle', 'button', 'carpet', 'circle',
  'cookie', 'dinner', 'engine', 'flower', 'guitar', 'hammer', 'jacket', 'kitten', 'ladder', 'lemon', 'magnet', 'mirror', 'monkey',
  'nest', 'ocean', 'parcel', 'pillow', 'puzzle', 'rabbit', 'robot', 'saddle', 'school', 'silver', 'spoon', 'summer', 'sunset',
  'ticket', 'tomato', 'tunnel', 'violin', 'wallet', 'winter', 'yellow', 'zebra', 'bottle', 'camera', 'desert', 'feather', 'galaxy',
  'helmet', 'jungle', 'kettle', 'lizard', 'meadow', 'noodle', 'pepper', 'rainbow', 'shadow', 'thunder', 'velvet', 'wizard'];

const pick = list => list[crypto.randomInt(list.length)];
const funName = () => pick(ADJECTIVES) + ' ' + pick(ANIMALS);
// e.g. "river472": a word and three digits (about 75,000 possibilities; logins are rate-limited)
const password = () => pick(PW_WORDS) + crypto.randomInt(100, 1000);

module.exports = {funName, password};
