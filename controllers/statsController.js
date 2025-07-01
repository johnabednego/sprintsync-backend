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


exports.timePerDay = async (req, res) => {
  // Group by date, then sum minutes per user
  const agg = await TimeEntry.aggregate([
    { $project: {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        user: '$user',
        minutes: '$minutes'
      }
    },
    { $group: {
        _id: { day: '$day', user: '$user' },
        total: { $sum: '$minutes' }
      }
    },
    { $group: {
        _id: '$_id.day',
        byUser: { $push: { k: '$_id.user', v: '$total' } }
      }
    },
    { $sort: { '_id': 1 } },
    { $project: {
        date: '$_id',
        data: { $arrayToObject: '$byUser' }
      }
    }
  ]);
  // Replace user IDs with names
  const users = await User.find().select('firstName lastName');
  const nameMap = Object.fromEntries(users.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`]));

  const result = agg.map(day => {
    const obj = { date: day.date };
    for (const [uid, mins] of Object.entries(day.data)) {
      obj[nameMap[uid] || uid] = mins;
    }
    return obj;
  });
  res.json(result);
};
