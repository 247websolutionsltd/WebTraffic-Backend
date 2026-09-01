const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);
resend.domains.create({ name: '247websolutions.com.ng' });
module.exports = resend;

