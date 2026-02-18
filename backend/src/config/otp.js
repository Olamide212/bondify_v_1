const generateOTP = () => {
  const length = parseInt(process.env.OTP_LENGTH) || 6;
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

const calculateOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRES_IN) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  calculateOTPExpiry,
};
