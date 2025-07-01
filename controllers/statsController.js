const User    = require('../models/User');
const Task    = require('../models/Task');
const Project = require('../models/Project');
const Tag     = require('../models/Tag');
const TimeEntry = require('../models/TimeEntry');

exports.adminStats = async (req, res) => {
  const [users, tags, projects, tasks] = await Promise.all([
    User.countDocuments(),
    Tag.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments()
  ]);
  res.json({ users, tags, projects, tasks });
};

exports.userStats = async (req, res) => {
  const userId = req.user.sub;
  const counts = await Promise.all(
    ['todo','inProgress','done'].map(status =>
      Task.countDocuments({ assignedTo: userId, status })
    )
  );
  res.json({ todo: counts[0], inProgress: counts[1], done: counts[2] });
};

exports.timePerDay = async (req, res, next) => {
  try {
    // 1) Project the day and a stringified user key
    // 2) Group by { day, userStr } summing minutes
    // 3) Regroup by day into an array of {k: userStr, v: total}
    // 4) Convert that array into an object field "data"
    // 5) Sort by day
    const agg = await TimeEntry.aggregate([
      {
        $project: {
          day: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          userStr: { $toString: '$user' },
          minutes: '$minutes'
        }
      },
      {
        $group: {
          _id: { day: '$day', user: '$userStr' },
          total: { $sum: '$minutes' }
        }
      },
      {
        $group: {
          _id: '$_id.day',
          byUser: {
            $push: { k: '$_id.user', v: '$total' }
          }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          data: { $arrayToObject: '$byUser' }
        }
      }
    ]);

    // 6) replace user IDs with names
    const users = await User.find().select('firstName lastName');
    const nameMap = Object.fromEntries(
      users.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`])
    );

    const result = agg.map(dayRec => {
      const out = { date: dayRec.date };
      for (const [userId, mins] of Object.entries(dayRec.data)) {
        const name = nameMap[userId] || userId;
        out[name] = mins;
      }
      return out;
    });

    return res.json(result);

  } catch (err) {
    next(err);
  }
};
