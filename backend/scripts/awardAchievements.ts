import mongoose from 'mongoose';
import { User } from '../models/User';
import Achievement from '../models/Achievement';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const achievements = await Achievement.find();
  const users = await User.find();

  for (const user of users) {
    for (const achievement of achievements) {
      const { type, value } = achievement.condition;
      let eligible = false;
      if (type === 'wins' && user.stats.wins >= value) eligible = true;
      if (type === 'tournaments' && user.stats.tournamentsPlayed >= value) eligible = true;
      if (type === 'first_place' && user.stats.tournamentsWon >= value) eligible = true;
      // Можно добавить другие условия
      if (eligible) {
        if (user && achievement && typeof achievement._id === 'string') {
          const added = await user.addAchievement(achievement._id);
          if (added) {
            console.log(`Achievement '${achievement.name}' awarded to user ${user.username}`);
          }
        }
      }
    }
  }
  await mongoose.disconnect();
  console.log('Achievement awarding complete.');
})(); 