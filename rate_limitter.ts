import express from 'express';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Rate limiter API is running',
    endpoints: [
      'POST /generate-otp (rate limited)',
      'POST /generate-otp-unlimited (no rate limit)',
      'POST /reset-password (rate limited)'
    ]
  });
});

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

type RequestRecord = {
  count: number;
  resetAt: number;
};

function createRateLimiter({ windowMs, maxRequests }: RateLimitOptions) {
  const requests = new Map<string, RequestRecord>();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const current = requests.get(key);
    const record = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    record.count += 1;
    requests.set(key, record);

    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter
      });
    }

    next();
  };
}

const generateOtpRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 3
});

const resetPasswordRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 5
});

// Store OTPs in a simple in-memory object
const otpStore: Record<string, string> = {};

function generateOtp(req: express.Request, res: express.Response) {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // generates a 6-digit OTP
  otpStore[email] = otp;

  console.log(`OTP for ${email}: ${otp}`); // Log the OTP to the console
  res.status(200).json({ message: "OTP generated and logged" });
}

// Rate-limited endpoint: maximum 3 requests per 10 minutes per IP.
app.post('/generate-otp', generateOtpRateLimiter, generateOtp);

// Comparison endpoint without rate limiting.
app.post('/generate-otp-unlimited', generateOtp);

// Endpoint to reset password
app.post('/reset-password', resetPasswordRateLimiter, (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }
  if (otpStore[email] === otp) {
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
    delete otpStore[email]; // Clear the OTP after use
    res.status(200).json({ message: "Password has been reset successfully" });
  } else {
    res.status(401).json({ message: "Invalid OTP" });
  }
});

app.listen(PORT, () => {
 console.log(`Server running on http://localhost:${PORT}`);
});
