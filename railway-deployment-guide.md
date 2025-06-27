# Railway Deployment Guide for bTree Backend

## 🚀 Quick Setup Steps

### 1. **Sign Up for Railway**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub (recommended)
- You get $5 free credit monthly

### 2. **Deploy from GitHub**
- Click "New Project" → "Deploy from GitHub repo"
- Select your repository
- Choose the `server` folder as the root directory

### 3. **Configure Environment Variables**
Railway will automatically detect your Node.js app, but you may want to set:
- `NODE_ENV=production`
- `PORT` (Railway sets this automatically)

### 4. **Deploy**
- Railway will automatically build and deploy
- You'll get a URL like: `https://your-app-name.railway.app`

## 🔧 Update Frontend Configuration

After deployment, update these files with your Railway URL:

### Update `src/hooks/useGameSocket.ts`
Replace the production URL:
```javascript
const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://YOUR-RAILWAY-URL.railway.app'; // Replace with your actual URL
  }
  return 'http://localhost:3001';
};
```

### Update `src/services/gameApi.ts`
Replace the production URL:
```javascript
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://YOUR-RAILWAY-URL.railway.app/api'; // Replace with your actual URL
  }
  return 'http://localhost:3001/api';
};
```

## 📋 Deployment Checklist

- [ ] Railway account created
- [ ] Repository connected to Railway
- [ ] Backend deployed successfully
- [ ] Railway URL obtained
- [ ] Frontend updated with Railway URL
- [ ] Frontend redeployed to Netlify
- [ ] CORS configured for Netlify domain
- [ ] WebSocket connection tested
- [ ] Trust game tested end-to-end

## 🔍 Testing Your Deployment

1. **Health Check**: Visit `https://your-railway-url.railway.app/health`
2. **API Test**: Visit `https://your-railway-url.railway.app/api/experiments`
3. **WebSocket Test**: Use your Netlify frontend to create an experiment

## 💡 Railway Features

- **Automatic HTTPS**: All Railway apps get SSL certificates
- **Custom Domains**: You can add your own domain later
- **Monitoring**: Built-in metrics and logs
- **Scaling**: Automatic scaling based on usage
- **Database**: Easy to add PostgreSQL or Redis if needed

## 🆘 Troubleshooting

### Common Issues:
1. **Build Fails**: Check that `package.json` has correct scripts
2. **Port Issues**: Railway sets PORT automatically, don't hardcode it
3. **CORS Errors**: Make sure your Netlify domain is in the CORS allowlist
4. **WebSocket Issues**: Ensure Railway URL is updated in frontend

### Logs:
- Check Railway dashboard for deployment logs
- Use `console.log` statements for debugging
- Railway provides real-time logs

## 💰 Cost Estimation

- **Free Tier**: $5 credit monthly (enough for hackathons)
- **Usage**: ~$0.10-0.50/day for light usage
- **Scaling**: Automatic based on traffic

Perfect for hackathons and demos! 🎉