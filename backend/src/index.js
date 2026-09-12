import app from './app.js';
import authRouter from './routers/auth.js';
import userRouter from './routers/user.js';
import adminRouter from './routers/admin.js';
import "dotenv/config";
import { verifyEmailConnection } from "./utils/emailService.js";

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await verifyEmailConnection();
});

export default app;
