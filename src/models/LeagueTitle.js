export const LeagueTitle = [
  {
    value: 'causedEarlySurrender',
    title: '스겜충',
    description: '설명',
    standard: 'max',
  },
  {
    value: 'visionScore',
    title: '리신',
    description: '설명',
    standard: 'min',
  },
  {
    value: 'turretKills',
    title: '포탑 철거충',
    description: '설명',
    standard: 'max',
  },
  {
    value: 'totalHeal',
    title: '문도박사',
    description: '설명',
    standard: 'max',
  },
  {
    value: 'doubleKills',
    title: '1+1',
    description: '설명',
    standard: 'max',
  },
];

export const getRandomLeagueTitle = (count) => {
  const result = [];
  const indexes = new Set();

  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * LeagueTitle.length);
    if (!indexes.has(randomIndex)) {
      result.push(LeagueTitle[randomIndex]);
      indexes.add(randomIndex);
    }
  }

  return result;
};
