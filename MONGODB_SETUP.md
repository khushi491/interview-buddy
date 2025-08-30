# MongoDB Atlas Setup Guide

## Quick Setup

1. **Create `.env.local` file** in your project root:

```bash
cp env.example .env.local
```

2. **Add your MongoDB Atlas connection string** to `.env.local`:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/interview-buddy?retryWrites=true&w=majority
```

3. **Test the connection**:

```bash
node scripts/test-mongodb.js
```

4. **Start your app**:

```bash
pnpm dev
```

## What This Fixes

- ✅ **Persistent storage** - Interviews won't disappear on server restart
- ✅ **No more 404 errors** - Interview data persists between sessions
- ✅ **Scalable** - Can handle multiple users and interviews
- ✅ **Production ready** - Uses MongoDB Atlas cloud database

## Your Interview Flow

1. User fills out the form with:

   - Position (e.g., Senior Product Manager)
   - Interview Focus (Technical, Behavioral, etc.)
   - Difficulty Level (Easy, Medium, Hard)
   - Interview Mode (Chat or Video/Voice)
   - CV Upload (optional)
   - Job Description (optional)

2. Interview is created and stored in MongoDB
3. User is redirected to the interview room
4. All data persists between sessions

## Troubleshooting

- **Connection failed**: Check your MongoDB Atlas connection string
- **Environment variables**: Make sure `.env.local` exists and has `MONGODB_URI`
- **Network issues**: Ensure your IP is whitelisted in MongoDB Atlas

## MongoDB Atlas Tips

- Use a dedicated database user (not admin)
- Whitelist your IP address in Network Access
- Use connection string with `?retryWrites=true&w=majority`
- Monitor your cluster usage in the Atlas dashboard
