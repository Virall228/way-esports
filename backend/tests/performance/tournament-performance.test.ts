import { Tournament } from '../../models/Tournament';
import { User } from '../../models/User';

const makeTelegramId = () => Number(`7${Date.now().toString().slice(-9)}`);

describe('Tournament Performance (smoke)', () => {
  let admin: any;

  beforeEach(async () => {
    admin = await new User({
      username: `perf_admin_${Date.now()}`,
      email: `perf_admin_${Date.now()}@test.dev`,
      password: 'password123',
      telegramId: makeTelegramId(),
      role: 'admin'
    }).save();
  });

  test('bulk tournament insert is reasonably fast', async () => {
    const payload = Array.from({ length: 100 }).map((_, i) => ({
      name: `PerfCup_${i}_${Date.now()}`,
      game: 'CS:GO',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxTeams: 16,
      prizePool: 1000 + i,
      description: 'Perf test',
      rules: 'Rules',
      format: 'single_elimination',
      type: 'team',
      createdBy: admin._id
    }));

    const t0 = Date.now();
    await Tournament.insertMany(payload);
    const dt = Date.now() - t0;

    expect(dt).toBeLessThan(10000);
  });

  test('read query with filter + sort is reasonably fast', async () => {
    const t0 = Date.now();
    const docs = await Tournament.find({ isActive: true })
      .sort({ startDate: -1 })
      .limit(20)
      .lean();
    const dt = Date.now() - t0;

    expect(Array.isArray(docs)).toBe(true);
    expect(dt).toBeLessThan(3000);
  });
});
