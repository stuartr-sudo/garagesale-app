# BlockSwap Marketplace

A modern, AI-powered local marketplace platform built with React, Supabase, and OpenAI.

## Features

- 🛍️ **Local Marketplace** - Buy and sell items in your community
- 🤖 **AI-Powered Listings** - Automatic title and description generation using OpenAI
- 💳 **Secure Payments** - Stripe integration for safe transactions
- 🏪 **Business Accounts** - Special features for local businesses
- ⭐ **Ratings & Reviews** - Build trust in the community
- 🔄 **Trade System** - Propose item trades with other users
- 📢 **Request Board** - Post requests for items you're looking for
- 🎨 **Modern Dark Theme** - Beautiful, responsive UI

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **Deployment**: Vercel

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd blockswap-marketplace
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://biwuxtvgvkkltrdpuptl.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 3. Database Setup

The database schema has already been created in your Supabase project. You can view the migrations in the Supabase dashboard.

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app.

## Building for Production

```bash
npm run build
npm run preview
```

## Deploying to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## Project Structure

```
src/
├── api/              # Supabase API layer
│   ├── entities.js   # Database entities
│   ├── functions.js  # Business logic
│   └── integrations.js # OpenAI, file uploads
├── components/       # React components
│   ├── additem/     # Item creation components
│   ├── marketplace/ # Marketplace components
│   ├── ui/          # Reusable UI components
│   └── ...
├── lib/             # Utility libraries
│   ├── supabase.js  # Supabase client
│   ├── openai.js    # OpenAI client
│   └── stripe.js    # Stripe client
├── pages/           # Page components
└── main.jsx         # App entry point
```

## Key Features Guide

### AI-Powered Listings

Upload photos of your items and let AI generate:
- Compelling titles
- Detailed descriptions
- Suggested categories and tags
- Price recommendations

### Secure Transactions

- Buyers pay through Stripe before pickup
- Sellers receive contact information after payment
- No hidden fees for individual users

### Business Features

- Verified business accounts
- Advertisement placement options
- Analytics and insights
- Custom storefronts

## Database Schema

Main tables:
- `profiles` - User profiles
- `items` - Marketplace listings
- `transactions` - Purchase records
- `advertisements` - Business ads
- `requests` - Item requests
- `ratings` - User reviews
- `trade_proposals` - Item trade offers
- `businesses` - Business account data

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for local communities