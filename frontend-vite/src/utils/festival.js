const FESTIVALS = [
  { month: 1, day: 1, name: 'New Year', emoji: '🎉', message: 'Happy New Year!', colors: ['#FF6B35', '#004E89'] },
  { month: 1, day: 14, name: 'Pongal', emoji: '🌾', message: 'Happy Pongal!', colors: ['#C0392B', '#F39C12'] },
  { month: 1, day: 26, name: 'Republic Day', emoji: '🇮🇳', message: 'Happy Republic Day!', colors: ['#FF9933', '#138808'] },
  { month: 4, day: 14, name: 'Vishu', emoji: '🌸', message: 'Happy Vishu!', colors: ['#FFD700', '#228B22'] },
  { month: 6, day: 29, name: 'Onam', emoji: '🌺', message: 'Happy Onam!', colors: ['#FFD700', '#006400'] },
  { month: 8, day: 15, name: 'Independence Day', emoji: '🇮🇳', message: 'Happy Independence Day!', colors: ['#FF9933', '#138808'] },
  { month: 10, day: 2, name: 'Gandhi Jayanti', emoji: '🕊️', message: 'Happy Gandhi Jayanti!', colors: ['#964B00', '#F5F5DC'] },
  { month: 11, day: 1, name: 'Kerala Piravi', emoji: '🌴', message: 'Happy Kerala Piravi!', colors: ['#008000', '#FFD700'] },
  { month: 12, day: 25, name: 'Christmas', emoji: '🎄', message: 'Merry Christmas!', colors: ['#D42426', '#228B22'] },
];

export function getActiveFestival() {
  const now = new Date();
  const today = { month: now.getMonth() + 1, day: now.getDate() };
  for (const f of FESTIVALS) {
    if (f.month === today.month && f.day === today.day) return f;
  }
  return null;
}
