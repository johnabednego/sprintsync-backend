const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const { SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  throw new Error('SMTP_USER, SMTP_PASS and SMTP_FROM must be set');
}

/**
 * Send a otp-related  email.
 * 
 * */

exports.sendOTP = async (to, otp, emailPurpose) => {
  const platformName = 'SprintSync'; 

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f7f7f7; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50;">Welcome to ${platformName}</h2>
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">
        Your One-Time Password (OTP) is:
        <strong style="display: block; font-size: 24px; color: #27ae60; margin: 10px 0;">${otp}</strong>
      </p>
      <p style="font-size: 14px; color: #666;">
        This code will expire in 10 minutes. If you did not request this, please ignore this email.
      </p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        &copy; ${new Date().getFullYear()} ${platformName}. All rights reserved.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${platformName} - ${emailPurpose} OTP Code`,
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html
  });
};



/**
 * Send a task-related notification email.
 *
 * @param {'created'|'updated'|'assigned'|'statusChanged'|'timeLogged'} type
 * @param {object} task   – populated Task document
 * @param {object} recipient – { email, firstName, lastName }
 */
exports.sendTaskNotification = async (type, task, recipient) => {
  const { title, description, status, totalMinutes, createdAt, updatedAt } = task;
  const fullName = `${recipient.firstName} ${recipient.lastName}`;
  let subject, intro;

  switch (type) {
    case 'created':
      subject = `New Task Created: "${title}"`;
      intro = `A new task has been created and assigned to you.`;
      break;
    case 'assigned':
      subject = `Task Assigned: "${title}"`;
      intro = `You have been assigned a task.`;
      break;
    case 'updated':
      subject = `Task Updated: "${title}"`;
      intro = `The task details have been updated.`;
      break;
    case 'statusChanged':
      subject = `Task Status Updated: "${title}" is now ${status}`;
      intro = `The status of your task has changed.`;
      break;
    case 'timeLogged':
      subject = `Time Logged on Task: "${title}"`;
      intro = `Minutes have been logged against the task.`;
      break;
    default:
      subject = `Notification for task "${title}"`;
      intro = ``;
  }

  const html = `
    <div style="font-family: sans-serif; max-width:600px; margin:auto; padding:20px; background:#fafafa; border-radius:8px;">
      <h2 style="color:#333;">${subject}</h2>
      <p>Hi ${fullName},</p>
      <p>${intro}</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Title</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Description</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${description || '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Status</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${status}</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Total Time</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${(totalMinutes/60).toFixed(2)} hrs</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #ddd;"><strong>Last Updated</strong></td>
          <td style="padding:8px; border:1px solid #ddd;">${new Date(updatedAt).toLocaleString()}</td>
        </tr>
      </table>
      <p style="font-size:12px; color:#666; margin-top:20px;">SprintSync Notification</p>
    </div>
  `;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient.email,
    subject,
    html
  });
};

/**
 * Send a project-related notification email.
 * @param {'created'|'updated'|'statusChanged'} type
 * @param {object} project – populated Project document
 * @param {object} recipient – { email, firstName, lastName }
 */
exports.sendProjectNotification = async (type, project, recipient) => {
  const { name, description, status, startDate, endDate, updatedAt } = project;
  const fullName = `${recipient.firstName} ${recipient.lastName}`;
  let subject, intro;

  switch (type) {
    case 'created':
      subject = `New Project: "${name}"`;
      intro = `A new project has been created and you have been added.`;
      break;
    case 'updated':
      subject = `Project Updated: "${name}"`;
      intro = `Project details have been revised.`;
      break;
    case 'statusChanged':
      subject = `Project Status Changed: "${name}" is now ${status}`;
      intro = `The status of a project you're part of has changed.`;
      break;
    default:
      subject = `Notification for project "${name}"`;
      intro = ``;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f0f0f0;border-radius:8px;">
      <h2>${subject}</h2>
      <p>Hi ${fullName},</p>
      <p>${intro}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ccc;">${name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Description</strong></td><td style="padding:8px;border:1px solid #ccc;">${description || '—'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Status</strong></td><td style="padding:8px;border:1px solid #ccc;">${status}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Start</strong></td><td style="padding:8px;border:1px solid #ccc;">${new Date(startDate).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>End</strong></td><td style="padding:8px;border:1px solid #ccc;">${endDate ? new Date(endDate).toLocaleDateString() : 'TBD'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Last Updated</strong></td><td style="padding:8px;border:1px solid #ccc;">${new Date(updatedAt).toLocaleString()}</td></tr>
      </table>
      <p style="font-size:12px;color:#666;margin-top:20px;">SprintSync Notification</p>
    </div>
  `;

  await transporter.sendMail({ from: SMTP_FROM, to: recipient.email, subject, html });
};

/**
 * Send a time-entry notification email.
 * @param {'created'} type
 * @param {object} entry – populated TimeEntry document
 * @param {object} recipient – { email, firstName, lastName }
 */
exports.sendTimeEntryNotification = async (type, entry, recipient) => {
  const { task, minutes, startTime, endTime, notes, createdAt } = entry;
  const fullName = `${recipient.firstName} ${recipient.lastName}`;
  const subject = `Time Logged: ${minutes} minute(s) on task "${task.title}"`;
  const intro = `A time entry has been logged for the following task.`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#fff;border-radius:8px;">
      <h2>${subject}</h2>
      <p>Hi ${fullName},</p>
      <p>${intro}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Task</strong></td><td style="padding:8px;border:1px solid #ddd;">${task.title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Minutes</strong></td><td style="padding:8px;border:1px solid #ddd;">${minutes}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Start Time</strong></td><td style="padding:8px;border:1px solid #ddd;">${new Date(startTime).toLocaleString()}</td></tr>
        ${endTime ? `<tr><td style="padding:8px;border:1px solid #ddd;"><strong>End Time</strong></td><td style="padding:8px;border:1px solid #ddd;">${new Date(endTime).toLocaleString()}</td></tr>` : ''}
        ${notes ? `<tr><td style="padding:8px;border:1px solid #ddd;"><strong>Notes</strong></td><td style="padding:8px;border:1px solid #ddd;">${notes}</td></tr>` : ''}
        <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Logged At</strong></td><td style="padding:8px;border:1px solid #ddd;">${new Date(createdAt).toLocaleString()}</td></tr>
      </table>
      <p style="font-size:12px;color:#666;margin-top:20px;">SprintSync Notification</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.SMTP_FROM, to: recipient.email, subject, html });
};

