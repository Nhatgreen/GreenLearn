export interface StickerPickerItem {
  id: string;
  name: string;
  type: 'emoji' | 'sticker' | 'gif';
  content: string;
  url?: string;
  isSvg?: boolean;
  category?: string;
  width?: number;
  height?: number;
}

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  items: StickerPickerItem[];
}

export interface StickerCategory {
  id: string;
  label: string;
  icon: string;
  items: StickerPickerItem[];
}

/**
 * Convert Unicode Emoji into official Twitter Twemoji SVG URL for 100% Vector Sharpness
 */
export function toTwemojiUrl(emoji: string): string {
  const codePoints: string[] = [];
  for (let i = 0; i < emoji.length; i++) {
    const cp = emoji.codePointAt(i);
    if (!cp) continue;
    if (cp > 0xffff) i++;
    if (cp === 0xfe0f) continue; // strip variation selector
    codePoints.push(cp.toString(16));
  }
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
}

export const SKIN_TONES = [
  { id: 'default', label: 'Mặc định (Vàng)', icon: '✋', code: '' },
  { id: 'light', label: 'Da sáng', icon: '✋🏻', code: '1f3fb' },
  { id: 'medium-light', label: 'Da sáng vừa', icon: '✋🏼', code: '1f3fc' },
  { id: 'medium', label: 'Da trung bình', icon: '✋🏽', code: '1f3fd' },
  { id: 'medium-dark', label: 'Da ngăm', icon: '✋🏾', code: '1f3fe' },
  { id: 'dark', label: 'Da tối', icon: '✋🏿', code: '1f3ff' },
];

function makeEmoji(id: string, name: string, char: string, category: string): StickerPickerItem {
  return {
    id: `em-${id}`,
    name,
    type: 'emoji',
    content: char,
    url: toTwemojiUrl(char),
    category
  };
}

// =========================================================================
// 1. COMPREHENSIVE EMOJI CATEGORIES (Miro Style - 9 Official Tabs)
// =========================================================================
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'people',
    label: 'Biểu cảm & Con người',
    icon: 'smile',
    items: [
      makeEmoji('grinning', 'Grinning Face', '😀', 'people'),
      makeEmoji('smiley', 'Grinning Face with Big Eyes', '😃', 'people'),
      makeEmoji('smile', 'Grinning Face with Smiling Eyes', '😄', 'people'),
      makeEmoji('beam', 'Beaming Face with Smiling Eyes', '😁', 'people'),
      makeEmoji('laughing', 'Grinning Squinting Face', '😆', 'people'),
      makeEmoji('sweat-smile', 'Grinning Face with Sweat', '😅', 'people'),
      makeEmoji('joy', 'Face with Tears of Joy', '😂', 'people'),
      makeEmoji('rofl', 'Rolling on the Floor Laughing', '🤣', 'people'),
      makeEmoji('blush', 'Smiling Face with Smiling Eyes', '😊', 'people'),
      makeEmoji('innocent', 'Smiling Face with Halo', '😇', 'people'),
      makeEmoji('slight-smile', 'Slightly Smiling Face', '🙂', 'people'),
      makeEmoji('upside-down', 'Upside-Down Face', '🙃', 'people'),
      makeEmoji('wink', 'Winking Face', '😉', 'people'),
      makeEmoji('relieved', 'Relieved Face', '😌', 'people'),
      makeEmoji('heart-eyes', 'Heart Eyes', '😍', 'people'),
      makeEmoji('stars', 'Star-Struck', '🤩', 'people'),
      makeEmoji('kissing-heart', 'Blowing Kiss', '😘', 'people'),
      makeEmoji('kissing', 'Kissing Face', '😗', 'people'),
      makeEmoji('yum', 'Savoring Food', '😋', 'people'),
      makeEmoji('stuck-out-tongue', 'Face with Tongue', '😛', 'people'),
      makeEmoji('zany', 'Zany Face', '🤪', 'people'),
      makeEmoji('money-mouth', 'Money-Mouth Face', '🤑', 'people'),
      makeEmoji('hugging', 'Hugging Face', '🤗', 'people'),
      makeEmoji('shushing', 'Shushing Face', '🤫', 'people'),
      makeEmoji('thinking', 'Thinking Face', '🤔', 'people'),
      makeEmoji('zipper', 'Zipper-Mouth Face', '🤐', 'people'),
      makeEmoji('raised-eyebrow', 'Face with Raised Eyebrow', '🤨', 'people'),
      makeEmoji('neutral', 'Neutral Face', '😐', 'people'),
      makeEmoji('expressionless', 'Expressionless Face', '😑', 'people'),
      makeEmoji('smirk', 'Smirking Face', '😏', 'people'),
      makeEmoji('unamused', 'Unamused Face', '😒', 'people'),
      makeEmoji('rolling-eyes', 'Face with Rolling Eyes', '🙄', 'people'),
      makeEmoji('grimacing', 'Grimacing Face', '😬', 'people'),
      makeEmoji('lying', 'Lying Face', '🤥', 'people'),
      makeEmoji('pensive', 'Pensive Face', '😔', 'people'),
      makeEmoji('sleepy', 'Sleepy Face', '😪', 'people'),
      makeEmoji('drooling', 'Drooling Face', '🤤', 'people'),
      makeEmoji('sleeping', 'Sleeping Face', '😴', 'people'),
      makeEmoji('mask', 'Medical Mask Face', '😷', 'people'),
      makeEmoji('thermometer', 'Face with Thermometer', '🤒', 'people'),
      makeEmoji('head-bandage', 'Face with Head-Bandage', '🤕', 'people'),
      makeEmoji('nauseated', 'Nauseated Face', '🤢', 'people'),
      makeEmoji('sneezing', 'Sneezing Face', '🤧', 'people'),
      makeEmoji('hot', 'Hot Face', '🥵', 'people'),
      makeEmoji('cold', 'Cold Face', '🥶', 'people'),
      makeEmoji('woozy', 'Woozy Face', '🥴', 'people'),
      makeEmoji('dizzy', 'Dizzy Face', '😵', 'people'),
      makeEmoji('exploding-head', 'Exploding Head Mind Blown', '🤯', 'people'),
      makeEmoji('cowboy', 'Cowboy Hat Face', '🤠', 'people'),
      makeEmoji('partying', 'Partying Face', '🥳', 'people'),
      makeEmoji('sunglasses', 'Smiling Face with Sunglasses', '😎', 'people'),
      makeEmoji('nerd', 'Nerd Face', '🤓', 'people'),
      makeEmoji('monocle', 'Face with Monocle', '🧐', 'people'),
      makeEmoji('confused', 'Confused Face', '😕', 'people'),
      makeEmoji('worried', 'Worried Face', '😟', 'people'),
      makeEmoji('pleading', 'Pleading Face', '🥺', 'people'),
      makeEmoji('cry', 'Crying Face', '😢', 'people'),
      makeEmoji('sob', 'Loudly Crying Face', '😭', 'people'),
      makeEmoji('scream', 'Face Screaming in Fear', '😱', 'people'),
      makeEmoji('rage', 'Enraged Face', '😡', 'people'),
      makeEmoji('thumbs-up', 'Thumbs Up Like', '👍', 'people'),
      makeEmoji('thumbs-down', 'Thumbs Down', '👎', 'people'),
      makeEmoji('clap', 'Clapping Hands', '👏', 'people'),
      makeEmoji('raised-hands', 'Raising Hands Celebrate', '🙌', 'people'),
      makeEmoji('open-hands', 'Open Hands', '👐', 'people'),
      makeEmoji('handshake', 'Handshake Deal', '🤝', 'people'),
      makeEmoji('fist', 'Fist Bump', '👊', 'people'),
      makeEmoji('peace', 'Peace Sign Victory', '✌️', 'people'),
      makeEmoji('crossed-fingers', 'Crossed Fingers Wish', '🤞', 'people'),
      makeEmoji('love-you', 'Love-You Gesture', '🤟', 'people'),
      makeEmoji('wave', 'Waving Hand Hello', '👋', 'people'),
      makeEmoji('point-up', 'Pointing Up Index', '☝️', 'people'),
      makeEmoji('point-down', 'Pointing Down', '👇', 'people'),
      makeEmoji('point-left', 'Pointing Left', '👈', 'people'),
      makeEmoji('point-right', 'Pointing Right', '👉', 'people'),
      makeEmoji('pray', 'Folded Hands Pray Thank You', '🙏', 'people'),
      makeEmoji('brain', 'Brain Intellect', '🧠', 'people'),
      makeEmoji('eye', 'Eye Watch', '👁️', 'people'),
      makeEmoji('eyes', 'Eyes Looking', '👀', 'people'),
      makeEmoji('saluting', 'Saluting Face', '🫡', 'people'),
      makeEmoji('melting', 'Melting Face', '🫠', 'people'),
      makeEmoji('holding-tears', 'Face Holding Back Tears', '🥹', 'people'),
      makeEmoji('sparkle-heart', 'Sparkling Heart', '💖', 'people')
    ]
  },
  {
    id: 'nature',
    label: 'Động vật & Tự nhiên',
    icon: 'leaf',
    items: [
      makeEmoji('dog', 'Dog Puppy', '🐶', 'nature'),
      makeEmoji('cat', 'Cat Kitten', '🐱', 'nature'),
      makeEmoji('mouse', 'Mouse', '🐭', 'nature'),
      makeEmoji('hamster', 'Hamster', '🐹', 'nature'),
      makeEmoji('rabbit', 'Rabbit Bunny', '🐰', 'nature'),
      makeEmoji('fox', 'Fox', '🦊', 'nature'),
      makeEmoji('bear', 'Bear', '🐻', 'nature'),
      makeEmoji('panda', 'Panda', '🐼', 'nature'),
      makeEmoji('koala', 'Koala', '🐨', 'nature'),
      makeEmoji('tiger', 'Tiger', '🐯', 'nature'),
      makeEmoji('lion', 'Lion', '🦁', 'nature'),
      makeEmoji('cow', 'Cow', '🐮', 'nature'),
      makeEmoji('pig', 'Pig', '🐷', 'nature'),
      makeEmoji('frog', 'Frog', '🐸', 'nature'),
      makeEmoji('monkey', 'Monkey', '🐵', 'nature'),
      makeEmoji('chicken', 'Chicken', '🐔', 'nature'),
      makeEmoji('penguin', 'Penguin', '🐧', 'nature'),
      makeEmoji('bird', 'Bird', '🐦', 'nature'),
      makeEmoji('duck', 'Duck ViT Mascot', '🦆', 'nature'),
      makeEmoji('eagle', 'Eagle', '🦅', 'nature'),
      makeEmoji('owl', 'Owl Tutor Wise', '🦉', 'nature'),
      makeEmoji('wolf', 'Wolf', '🐺', 'nature'),
      makeEmoji('unicorn', 'Unicorn Magic', '🦄', 'nature'),
      makeEmoji('bee', 'Honeybee Busy', '🐝', 'nature'),
      makeEmoji('butterfly', 'Butterfly', '🦋', 'nature'),
      makeEmoji('snail', 'Snail Slow Study', '🐌', 'nature'),
      makeEmoji('bug', 'Caterpillar Bug Debug', '🐛', 'nature'),
      makeEmoji('ant', 'Ant Hard Working', '🐜', 'nature'),
      makeEmoji('octopus', 'Octopus Multitask', '🐙', 'nature'),
      makeEmoji('dolphin', 'Dolphin', '🐬', 'nature'),
      makeEmoji('whale', 'Whale', '🐳', 'nature'),
      makeEmoji('turtle', 'Turtle Steady', '🐢', 'nature'),
      makeEmoji('evergreen', 'Evergreen Tree', '🌲', 'nature'),
      makeEmoji('cactus', 'Cactus', '🌵', 'nature'),
      makeEmoji('four-leaf', 'Four Leaf Clover Luck', '🍀', 'nature'),
      makeEmoji('maple', 'Maple Leaf Autumn', '🍁', 'nature'),
      makeEmoji('sunflower', 'Sunflower', '🌻', 'nature'),
      makeEmoji('cherry-blossom', 'Cherry Blossom Sakura', '🌸', 'nature'),
      makeEmoji('herb', 'Herb Seedling Growth', '🌱', 'nature'),
      makeEmoji('sun', 'Sun Warmth Energy', '☀️', 'nature'),
      makeEmoji('moon', 'Crescent Moon Night Study', '🌙', 'nature'),
      makeEmoji('rainbow', 'Rainbow Dream', '🌈', 'nature')
    ]
  },
  {
    id: 'food',
    label: 'Đồ ăn & Thức uống',
    icon: 'burger',
    items: [
      makeEmoji('apple', 'Red Apple Study', '🍎', 'food'),
      makeEmoji('green-apple', 'Green Apple Fresh', '🍏', 'food'),
      makeEmoji('banana', 'Banana Energy', '🍌', 'food'),
      makeEmoji('watermelon', 'Watermelon', '🍉', 'food'),
      makeEmoji('grapes', 'Grapes', '🍇', 'food'),
      makeEmoji('strawberry', 'Strawberry', '🍓', 'food'),
      makeEmoji('cherries', 'Cherries', '🍒', 'food'),
      makeEmoji('peach', 'Peach', '🍑', 'food'),
      makeEmoji('avocado', 'Avocado', '🥑', 'food'),
      makeEmoji('carrot', 'Carrot Vitamin', '🥕', 'food'),
      makeEmoji('corn', 'Ear of Corn', '🌽', 'food'),
      makeEmoji('pizza', 'Pizza Slice Feast', '🍕', 'food'),
      makeEmoji('burger', 'Hamburger Fast Food', '🍔', 'food'),
      makeEmoji('fries', 'French Fries Snack', '🍟', 'food'),
      makeEmoji('hotdog', 'Hot Dog', '🌭', 'food'),
      makeEmoji('sandwich', 'Sandwich Lunch', '🥪', 'food'),
      makeEmoji('taco', 'Taco', '🌮', 'food'),
      makeEmoji('burrito', 'Burrito', '🌯', 'food'),
      makeEmoji('ramen', 'Steaming Bowl Ramen Noodles', '🍜', 'food'),
      makeEmoji('sushi', 'Sushi Bento', '🍣', 'food'),
      makeEmoji('rice', 'Cooked Rice Bowl', '🍚', 'food'),
      makeEmoji('bento', 'Bento Box Lunch', '🍱', 'food'),
      makeEmoji('icecream', 'Ice Cream Cone Sweet', '🍦', 'food'),
      makeEmoji('shaved-ice', 'Shaved Ice Dessert', '🍧', 'food'),
      makeEmoji('donut', 'Doughnut Donut', '🍩', 'food'),
      makeEmoji('cookie', 'Cookie Treat', '🍪', 'food'),
      makeEmoji('birthday-cake', 'Birthday Cake Party', '🎂', 'food'),
      makeEmoji('cupcake', 'Cupcake', '🧁', 'food'),
      makeEmoji('chocolate', 'Chocolate Bar Focus', '🍫', 'food'),
      makeEmoji('popcorn', 'Popcorn Cinema', '🍿', 'food'),
      makeEmoji('coffee', 'Hot Coffee Focus Espresso', '☕', 'food'),
      makeEmoji('tea', 'Tea Cup Match Green Tea', '🍵', 'food'),
      makeEmoji('boba', 'Bubble Tea Boba Milk Tea', '🧋', 'food'),
      makeEmoji('beverage-box', 'Beverage Juice Box', '🧃', 'food'),
      makeEmoji('mate', 'Mate Drink Herbal', '🧉', 'food')
    ]
  },
  {
    id: 'activities',
    label: 'Hoạt động & Thể thao',
    icon: 'football',
    items: [
      makeEmoji('soccer', 'Soccer Ball Football', '⚽', 'activities'),
      makeEmoji('basketball', 'Basketball Court', '🏀', 'activities'),
      makeEmoji('football-am', 'American Football', '🏈', 'activities'),
      makeEmoji('baseball', 'Baseball Bat', '⚾', 'activities'),
      makeEmoji('tennis', 'Tennis Racket', '🎾', 'activities'),
      makeEmoji('volleyball', 'Volleyball', '🏐', 'activities'),
      makeEmoji('badminton', 'Badminton Shuttlecock', '🏸', 'activities'),
      makeEmoji('trophy', 'Trophy Cup Winner 1st', '🏆', 'activities'),
      makeEmoji('medal-1st', '1st Place Gold Medal Top', '🥇', 'activities'),
      makeEmoji('medal-2nd', '2nd Place Silver Medal', '🥈', 'activities'),
      makeEmoji('medal-3rd', '3rd Place Bronze Medal', '🥉', 'activities'),
      makeEmoji('video-game', 'Video Gamepad Controller Gaming', '🎮', 'activities'),
      makeEmoji('joystick', 'Joystick Arcade', '🕹️', 'activities'),
      makeEmoji('dice', 'Game Die Dice Probability', '🎲', 'activities'),
      makeEmoji('chess-pawn', 'Chess Pawn Strategy', '♟️', 'activities'),
      makeEmoji('dart', 'Direct Hit Bullseye Dart Goal', '🎯', 'activities'),
      makeEmoji('bow-arrow', 'Bow and Arrow Precision', '🏹', 'activities'),
      makeEmoji('art-palette', 'Artist Palette Painting Design', '🎨', 'activities'),
      makeEmoji('music-notes', 'Musical Notes Melody Tune', '🎶', 'activities'),
      makeEmoji('guitar', 'Guitar Rock Acoustic', '🎸', 'activities'),
      makeEmoji('headphones', 'Headphones Audio Focus', '🎧', 'activities'),
      makeEmoji('microphone', 'Microphone Speech Presentation', '🎤', 'activities'),
      makeEmoji('skate', 'Skateboard Ride', '🛹', 'activities'),
      makeEmoji('climbing', 'Person Climbing Mountain Goal', '🧗', 'activities')
    ]
  },
  {
    id: 'travel',
    label: 'Du lịch & Địa điểm',
    icon: 'bus',
    items: [
      makeEmoji('rocket', 'Rocket Ship Launch Blastoff', '🚀', 'travel'),
      makeEmoji('airplane', 'Airplane Flight Travel', '✈️', 'travel'),
      makeEmoji('car', 'Automobile Car Drive', '🚗', 'travel'),
      makeEmoji('bus', 'Bus Public Transit School', '🚌', 'travel'),
      makeEmoji('train', 'High-Speed Bullet Train', '🚄', 'travel'),
      makeEmoji('bike', 'Bicycle Cycling Commute', '🚲', 'travel'),
      makeEmoji('scooter', 'Kick Scooter', '🛴', 'travel'),
      makeEmoji('ship', 'Passenger Ship Cruise', '🚢', 'travel'),
      makeEmoji('school', 'School Building Academy Campus', '🏫', 'travel'),
      makeEmoji('classical-building', 'University Classical Building Law', '🏛️', 'travel'),
      makeEmoji('hospital', 'Hospital Medical Clinic', '🏥', 'travel'),
      makeEmoji('office', 'Office Building Workplace', '🏢', 'travel'),
      makeEmoji('bank', 'Bank Finance Vault', '🏦', 'travel'),
      makeEmoji('house', 'House Home Cozy', '🏠', 'travel'),
      makeEmoji('mountain', 'Snow-Capped Mountain Summit Peak', '🏔️', 'travel'),
      makeEmoji('volcano', 'Volcano Eruption', '🌋', 'travel'),
      makeEmoji('camping', 'Camping Tent Outdoor Adventure', '🏕️', 'travel'),
      makeEmoji('sunrise', 'Sunrise Morning Study Dawn', '🌅', 'travel'),
      makeEmoji('night-stars', 'Milky Way Night Sky Stars', '🌌', 'travel'),
      makeEmoji('globe-asia', 'Globe Showing Asia Pacific Vietnam', '🌏', 'travel'),
      makeEmoji('globe-meridians', 'Globe with Meridians World', '🌐', 'travel')
    ]
  },
  {
    id: 'objects',
    label: 'Đồ vật & Dụng cụ',
    icon: 'lightbulb',
    items: [
      makeEmoji('lightbulb', 'Light Bulb Idea Eureka Insight', '💡', 'objects'),
      makeEmoji('books', 'Books Library Study Reading', '📚', 'objects'),
      makeEmoji('open-book', 'Open Book Textbook Guide', '📖', 'objects'),
      makeEmoji('notebook', 'Spiral Notebook Memo Journal', '📓', 'objects'),
      makeEmoji('pencil', 'Pencil Write Drawing Note', '✏️', 'objects'),
      makeEmoji('pen', 'Fountain Pen Signature', '🖋️', 'objects'),
      makeEmoji('crayon', 'Crayon Color Sketch', '🖍️', 'objects'),
      makeEmoji('laptop', 'Laptop Computer Mac PC Code', '💻', 'objects'),
      makeEmoji('desktop', 'Desktop Monitor Display Screen', '🖥️', 'objects'),
      makeEmoji('keyboard', 'Keyboard Typing Fast', '⌨️', 'objects'),
      makeEmoji('phone', 'Mobile Phone Smartphone Mobile', '📱', 'objects'),
      makeEmoji('clock', 'Alarm Clock Time Pomodoro Deadline', '⏰', 'objects'),
      makeEmoji('stopwatch', 'Stopwatch Timer Interval', '⏱️', 'objects'),
      makeEmoji('hourglass', 'Hourglass Sand Flowing', '⏳', 'objects'),
      makeEmoji('microscope', 'Microscope Science Biology Lab', '🔬', 'objects'),
      makeEmoji('telescope', 'Telescope Astronomy Physics', '🔭', 'objects'),
      makeEmoji('test-tube', 'Test Tube Chemistry Reaction', '🧪', 'objects'),
      makeEmoji('dna', 'DNA Double Helix Genetics', '🧬', 'objects'),
      makeEmoji('chart', 'Chart Increasing Trend Growth Graph', '📈', 'objects'),
      makeEmoji('memo', 'Memo Paper Note Sticky', '📝', 'objects'),
      makeEmoji('clipboard', 'Clipboard Checklist Task Plan', '📋', 'objects'),
      makeEmoji('calendar', 'Calendar Schedule Date Meeting', '📅', 'objects'),
      makeEmoji('pin', 'Pushpin Red Pin Location Marker', '📌', 'objects'),
      makeEmoji('paperclip', 'Paperclip Attachment Document', '📎', 'objects'),
      makeEmoji('scissors', 'Scissors Cut Snipping Tool', '✂️', 'objects'),
      makeEmoji('magnifier', 'Magnifying Glass Search Inspect', '🔍', 'objects'),
      makeEmoji('lock', 'Locked Padlock Security Private', '🔒', 'objects'),
      makeEmoji('unlock', 'Unlocked Padlock Open Access', '🔓', 'objects'),
      makeEmoji('key', 'Key Access Solution Answer', '🔑', 'objects'),
      makeEmoji('gem', 'Gem Stone Diamond Value High Tier', '💎', 'objects'),
      makeEmoji('coin', 'Coin Gold Currency Token', '🪙', 'objects'),
      makeEmoji('battery', 'Full Battery Energy Charged', '🔋', 'objects'),
      makeEmoji('wrench', 'Wrench Repair Tool Settings', '🔧', 'objects'),
      makeEmoji('gear', 'Gear Settings Configuration Engine', '⚙️', 'objects'),
      makeEmoji('inbox', 'Inbox Tray Tasks Messages', '📥', 'objects'),
      makeEmoji('package', 'Package Box Delivery Parcel', '📦', 'objects')
    ]
  },
  {
    id: 'symbols',
    label: 'Ký hiệu & Biểu trưng',
    icon: 'heart-spark',
    items: [
      makeEmoji('heart-red', 'Red Heart Love Favorite', '❤️', 'symbols'),
      makeEmoji('heart-orange', 'Orange Heart Brand ViT Accent', '🧡', 'symbols'),
      makeEmoji('heart-yellow', 'Yellow Heart Friendship', '💛', 'symbols'),
      makeEmoji('heart-green', 'Green Heart Success Nature', '💚', 'symbols'),
      makeEmoji('heart-blue', 'Blue Heart Trust Loyalty', '💙', 'symbols'),
      makeEmoji('heart-purple', 'Purple Heart Creativity Magic', '💜', 'symbols'),
      makeEmoji('sparkles', 'Sparkles AI Magic Flash Intelligence', '✨', 'symbols'),
      makeEmoji('star-gold', 'Glowing Star Rating 5 Stars Grade A', '⭐', 'symbols'),
      makeEmoji('fire', 'Fire Flame Streak Hot Trend Study', '🔥', 'symbols'),
      makeEmoji('100', 'Hundred Points Score 100 Perfect', '💯', 'symbols'),
      makeEmoji('check-mark', 'Check Mark Green Done Correct Valid', '✅', 'symbols'),
      makeEmoji('cross-mark', 'Cross Mark Red Wrong Error Cancel', '❌', 'symbols'),
      makeEmoji('question-mark', 'Red Question Mark Ask Doubt Help', '❓', 'symbols'),
      makeEmoji('exclamation', 'Exclamation Mark Notice Urgent Warn', '❗', 'symbols'),
      makeEmoji('warning', 'Warning Sign Caution Alert Matrix', '⚠️', 'symbols'),
      makeEmoji('recycle', 'Recycling Symbol Refresh Loop Repeat', '♻️', 'symbols'),
      makeEmoji('infinity', 'Infinity Endless Unlimited Math', '♾️', 'symbols'),
      makeEmoji('bell', 'Bell Notification Alert Reminder', '🔔', 'symbols'),
      makeEmoji('mute', 'Muted Bell Silent Mode DND', '🔕', 'symbols'),
      makeEmoji('lightning', 'High Voltage Lightning Flash Bolt Fast', '⚡', 'symbols'),
      makeEmoji('collision', 'Collision Boom Impact Explosion', '💥', 'symbols'),
      makeEmoji('speech-balloon', 'Speech Balloon Comment Chat Dialogue', '💬', 'symbols'),
      makeEmoji('thought-balloon', 'Thought Balloon Idea Think Ponder', '💭', 'symbols'),
      makeEmoji('prohibited', 'Prohibited Forbidden No Entry Ban', '🚫', 'symbols'),
      makeEmoji('radioactive', 'Radioactive Danger Sign', '☢️', 'symbols'),
      makeEmoji('plus-math', 'Plus Sign Addition Math', '➕', 'symbols'),
      makeEmoji('minus-math', 'Minus Sign Subtraction Math', '➖', 'symbols'),
      makeEmoji('divide-math', 'Division Sign Math Calculate', '➗', 'symbols')
    ]
  },
  {
    id: 'flags',
    label: 'Cờ các quốc gia',
    icon: 'flag',
    items: [
      makeEmoji('flag-vn', 'Vietnam Flag VN Quốc kỳ Việt Nam', '🇻🇳', 'flags'),
      makeEmoji('flag-us', 'United States Flag USA', '🇺🇸', 'flags'),
      makeEmoji('flag-uk', 'United Kingdom Flag Great Britain UK', '🇬🇧', 'flags'),
      makeEmoji('flag-jp', 'Japan Flag Nihon', '🇯🇵', 'flags'),
      makeEmoji('flag-kr', 'South Korea Flag Taegeukgi', '🇰🇷', 'flags'),
      makeEmoji('flag-fr', 'France Flag French', '🇫🇷', 'flags'),
      makeEmoji('flag-de', 'Germany Flag Deutschland', '🇩🇪', 'flags'),
      makeEmoji('flag-ca', 'Canada Flag Maple', '🇨🇦', 'flags'),
      makeEmoji('flag-au', 'Australia Flag Aussie', '🇦🇺', 'flags'),
      makeEmoji('flag-sg', 'Singapore Flag SG', '🇸🇬', 'flags'),
      makeEmoji('flag-th', 'Thailand Flag Thai', '🇹🇭', 'flags'),
      makeEmoji('flag-cn', 'China Flag PR China', '🇨🇳', 'flags'),
      makeEmoji('flag-in', 'India Flag Bharat', '🇮🇳', 'flags'),
      makeEmoji('flag-ru', 'Russia Flag Russian Federation', '🇷🇺', 'flags'),
      makeEmoji('flag-br', 'Brazil Flag Brasil', '🇧🇷', 'flags'),
      makeEmoji('flag-es', 'Spain Flag España', '🇪🇸', 'flags'),
      makeEmoji('flag-it', 'Italy Flag Italia', '🇮🇹', 'flags'),
      makeEmoji('flag-chequered', 'Chequered Finish Flag Race Victory', '🏁', 'flags'),
      makeEmoji('flag-triangular', 'Triangular Red Flag Goal Milestone', '🚩', 'flags'),
      makeEmoji('flag-pirate', 'Pirate Flag Skull Crossbones', '🏴‍☠️', 'flags'),
      makeEmoji('flag-white', 'White Flag Peace Truce', '🏳️', 'flags')
    ]
  }
];

// =========================================================================
// 2. STICKER CHUYÊN BIỆT CHO MÔI TRƯỜNG HỌC TẬP (100% SVG Vector Sắc Nét)
// =========================================================================
export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    id: 'da_hieu',
    label: 'Đã hiểu',
    icon: '✅',
    items: [
      {
        id: 'st-badge-approved',
        name: 'Huy hiệu Đã Hiểu (Đã Duyệt)',
        type: 'sticker',
        isSvg: true,
        width: 150,
        height: 60,
        content: `<svg viewBox="0 0 140 50" width="100%" height="100%"><rect x="4" y="4" width="132" height="42" rx="21" fill="#ecfdf5" stroke="#10b981" stroke-width="2.5"/><circle cx="26" cy="25" r="12" fill="#10b981"/><path d="M21 25 L25 29 L31 21" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="44" y="31" font-size="14" font-weight="800" fill="#065f46" font-family="sans-serif">ĐÃ HIỂU</text></svg>`
      },
      {
        id: 'st-study-target',
        name: 'Mục tiêu hoàn thành 100%',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 130,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="42" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="#fff" stroke="#ef4444" stroke-width="3"/><circle cx="50" cy="50" r="14" fill="#ef4444"/><polygon points="50 12 56 34 78 36 60 50 66 72 50 58 34 72 40 50 22 36 44 34" fill="#fbbf24" stroke="#000" stroke-width="1.5"/></svg>`
      },
      {
        id: 'st-mood-100',
        name: 'Điểm 100 tuyệt đối',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 100,
        content: `<svg viewBox="0 0 120 80" width="100%" height="100%"><text x="60" y="52" font-size="52" font-weight="900" fill="#dc2626" text-anchor="middle" font-family="Arial, sans-serif">100</text><line x1="20" y1="64" x2="100" y2="64" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/><line x1="24" y1="72" x2="96" y2="72" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/></svg>`
      },
      {
        id: 'st-study-medal',
        name: 'Huy chương vàng xuất sắc',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="36 12 50 42 32 42" fill="#3b82f6" stroke="#000" stroke-width="2"/><polygon points="64 12 50 42 68 42" fill="#ef4444" stroke="#000" stroke-width="2"/><circle cx="50" cy="62" r="26" fill="#facc15" stroke="#ca8a04" stroke-width="3"/><text x="50" y="70" font-size="24" font-weight="900" fill="#713f12" text-anchor="middle">1</text></svg>`
      },
      {
        id: 'st-study-grad-cap',
        name: 'Mũ tốt nghiệp vinh danh',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 120,
        content: `<svg viewBox="0 0 100 80" width="100%" height="100%"><polygon points="50 14 92 34 50 54 8 34" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/><path d="M26 44 V60 C26 70 74 70 74 60 V44" fill="#334155" stroke="#0f172a" stroke-width="2.5"/><line x1="84" y1="38" x2="84" y2="64" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/><circle cx="84" cy="66" r="3" fill="#eab308"/></svg>`
      }
    ]
  },
  {
    id: 'can_on',
    label: 'Cần ôn',
    icon: '⏳',
    items: [
      {
        id: 'st-study-books',
        name: 'Chồng sách giáo trình cần ôn',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 130,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="18" y="64" width="64" height="18" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2.5"/><rect x="22" y="44" width="56" height="18" rx="4" fill="#10b981" stroke="#047857" stroke-width="2.5"/><rect x="26" y="24" width="48" height="18" rx="4" fill="#f97316" stroke="#c2410c" stroke-width="2.5"/><polygon points="70 28 80 28 75 38" fill="#fef08a"/></svg>`
      },
      {
        id: 'st-study-microscope',
        name: 'Nghiên cứu đào sâu kiến thức',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="25" y="82" width="50" height="10" rx="3" fill="#64748b" stroke="#334155" stroke-width="2"/><path d="M50 82 V60 A20 20 0 0 1 70 40" fill="none" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><rect x="35" y="16" width="22" height="42" rx="4" transform="rotate(-25 46 37)" fill="#0284c7" stroke="#0369a1" stroke-width="2.5"/><circle cx="34" cy="54" r="8" fill="#facc15" stroke="#ca8a04" stroke-width="2"/></svg>`
      },
      {
        id: 'st-funky-padlock',
        name: 'Khái niệm then chốt cần giải mã',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M35 44 V30 A15 15 0 0 1 65 30 V44" fill="none" stroke="#facc15" stroke-width="5" stroke-linecap="round"/><rect x="25" y="44" width="50" height="42" rx="8" fill="#c084fc" stroke="#000" stroke-width="2.5"/><circle cx="50" cy="62" r="8" fill="#4ade80" stroke="#000" stroke-width="2"/><polygon points="48 66 52 66 54 74 46 74" fill="#000"/><path d="M25 60 Q12 55 16 70" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/><path d="M75 60 Q88 55 84 70" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>`
      },
      {
        id: 'st-funky-crystal-ball',
        name: 'Dự đoán đề thi trắc nghiệm',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="46" r="32" fill="#a7f3d0" stroke="#000" stroke-width="2.5"/><path d="M34 46 Q50 30 66 46 Q50 62 34 46 Z" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="50" cy="46" r="5" fill="#a855f7"/><rect x="32" y="76" width="36" height="12" rx="4" fill="#818cf8" stroke="#000" stroke-width="2.5"/></svg>`
      }
    ]
  },
  {
    id: 'quan_trong',
    label: 'Quan trọng',
    icon: '🔥',
    items: [
      {
        id: 'st-badge-priority',
        name: 'Huy hiệu Trọng tâm (Top Priority)',
        type: 'sticker',
        isSvg: true,
        width: 160,
        height: 60,
        content: `<svg viewBox="0 0 150 50" width="100%" height="100%"><rect x="4" y="4" width="142" height="42" rx="21" fill="#fef2f2" stroke="#ef4444" stroke-width="2.5"/><circle cx="26" cy="25" r="12" fill="#ef4444"/><path d="M26 18 V27 M26 31 V33" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><text x="44" y="31" font-size="13" font-weight="800" fill="#991b1b" font-family="sans-serif">TRỌNG TÂM</text></svg>`
      },
      {
        id: 'st-mood-flame',
        name: 'Ngọn lửa chuỗi ngày học tập',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 10 C50 30 75 40 75 64 A25 25 0 0 1 25 64 C25 44 40 34 50 10 Z" fill="#16A34A" stroke="#9a3412" stroke-width="3"/><path d="M50 38 C50 50 64 56 64 68 A14 14 0 0 1 36 68 C36 56 45 50 50 38 Z" fill="#fef08a"/></svg>`
      },
      {
        id: 'st-study-idea',
        name: 'Ý tưởng đột phá',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 18 A24 24 0 0 0 32 54 L36 66 L64 66 L68 54 A24 24 0 0 0 50 18 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><line x1="40" y1="72" x2="60" y2="72" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="78" x2="56" y2="78" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="6" x2="50" y2="12" stroke="#eab308" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="20" x2="28" y2="24" stroke="#eab308" stroke-width="3" stroke-linecap="round"/><line x1="78" y1="20" x2="72" y2="24" stroke="#eab308" stroke-width="3" stroke-linecap="round"/></svg>`
      },
      {
        id: 'st-mood-rocket',
        name: 'Tăng tốc về đích',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50 10 68 40 32 40" fill="#ef4444" stroke="#000" stroke-width="2.5"/><rect x="36" y="40" width="28" height="34" rx="4" fill="#f8fafc" stroke="#000" stroke-width="2.5"/><circle cx="50" cy="54" r="6" fill="#38bdf8" stroke="#000" stroke-width="2"/><polygon points="24 64 36 54 36 74" fill="#f97316" stroke="#000" stroke-width="2"/><polygon points="76 64 64 54 64 74" fill="#f97316" stroke="#000" stroke-width="2"/><polygon points="42 74 58 74 50 94" fill="#facc15" stroke="#f97316" stroke-width="2"/></svg>`
      },
      {
        id: 'st-mascot-vit',
        name: 'Biểu tượng Chú Vịt ViTudy',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="58" rx="30" ry="24" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/><circle cx="62" cy="36" r="18" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/><ellipse cx="78" cy="38" rx="12" ry="7" fill="#f97316" stroke="#c2410c" stroke-width="2"/><circle cx="66" cy="32" r="2.5" fill="#000"/><circle cx="68" cy="31" r="0.8" fill="#fff"/><polygon points="45 14 75 22 55 24" fill="#1e293b"/><line x1="42" y1="80" x2="38" y2="92" stroke="#f97316" stroke-width="3" stroke-linecap="round"/><line x1="58" y1="80" x2="58" y2="92" stroke="#f97316" stroke-width="3" stroke-linecap="round"/></svg>`
      }
    ]
  },
  {
    id: 'cong_thuc',
    label: 'Công thức & Dụng cụ',
    icon: '📐',
    items: [
      {
        id: 'st-funky-laptop',
        name: 'Laptop thực hành lập trình',
        type: 'sticker',
        isSvg: true,
        width: 140,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="25" y="22" width="50" height="40" rx="4" fill="#38bdf8" stroke="#000" stroke-width="2.5"/><rect x="32" y="28" width="36" height="28" rx="2" fill="#fff" stroke="#000" stroke-width="2"/><rect x="40" y="36" width="3" height="3" fill="#000"/><rect x="56" y="36" width="3" height="3" fill="#000"/><path d="M42 46 h16" stroke="#000" stroke-width="2.5"/><polygon points="15 68 85 68 75 62 25 62" fill="#facc15" stroke="#000" stroke-width="2.5"/><path d="M35 68 L25 86 L35 88" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/><path d="M65 68 L75 86 L85 88" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/></svg>`
      },
      {
        id: 'st-funky-pencil',
        name: 'Bút chì ghi chú công thức',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%" transform="rotate(25 50 50)"><rect x="38" y="24" width="24" height="48" fill="#4ade80" stroke="#000" stroke-width="2.5"/><polygon points="38 72 62 72 50 92" fill="#fed7aa" stroke="#000" stroke-width="2.5"/><polygon points="46 86 54 86 50 92" fill="#000"/><rect x="38" y="10" width="24" height="14" rx="4" fill="#fb7185" stroke="#000" stroke-width="2.5"/><circle cx="45" cy="42" r="2.5" fill="#000"/><circle cx="55" cy="42" r="2.5" fill="#000"/><path d="M46 50 Q50 54 54 50" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`
      },
      {
        id: 'st-mascot-owl',
        name: 'Gia sư hướng dẫn giải toán',
        type: 'sticker',
        isSvg: true,
        width: 130,
        height: 140,
        content: `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="54" rx="28" ry="32" fill="#78350f" stroke="#451a03" stroke-width="2.5"/><ellipse cx="50" cy="58" rx="18" ry="22" fill="#fef3c7"/><circle cx="38" cy="40" r="11" fill="#fff" stroke="#451a03" stroke-width="2"/><circle cx="62" cy="40" r="11" fill="#fff" stroke="#451a03" stroke-width="2"/><circle cx="38" cy="40" r="4.5" fill="#000"/><circle cx="62" cy="40" r="4.5" fill="#000"/><polygon points="50 48 46 54 54 54" fill="#f97316"/><rect x="32" y="14" width="36" height="8" rx="2" fill="#1e293b"/></svg>`
      },
      {
        id: 'st-funky-dumpster-fire',
        name: 'Lỗi bug hóc búa cần gỡ',
        type: 'sticker',
        isSvg: true,
        width: 150,
        height: 130,
        content: `<svg viewBox="0 0 100 90" width="100%" height="100%"><polygon points="30 40 40 18 50 32 60 12 70 38 80 24 75 42" fill="#f97316" stroke="#000" stroke-width="2.5"/><polygon points="38 40 45 26 52 35 58 22 68 40" fill="#facc15"/><rect x="20" y="40" width="60" height="38" rx="4" fill="#4ade80" stroke="#000" stroke-width="2.5"/><polygon points="12 40 22 28 80 40" fill="#22c55e" stroke="#000" stroke-width="2.5"/><circle cx="42" cy="56" r="3" fill="#000"/><circle cx="62" cy="56" r="3" fill="#000"/><ellipse cx="52" cy="66" rx="4" ry="5" fill="#000"/><circle cx="28" cy="82" r="4" fill="#000"/><circle cx="72" cy="82" r="4" fill="#000"/></svg>`
      }
    ]
  }
];
