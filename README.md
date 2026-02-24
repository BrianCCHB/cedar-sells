# Cedar Sells - Property Investment Platform

A Next.js web application for showcasing investment properties for Cedar Sells, a real estate investment company in Lafayette, Louisiana.

## 🏡 Overview

This platform allows Cedar Sells to showcase their investment property portfolio with three tiers of access:

- **Public**: View limited property information (teasers)
- **Registered**: Full property details and exact addresses
- **VIP**: Access to off-market deals and exclusive properties

## 🚀 Features

- **Property Listings**: Browse Fix & Flip, Wholesale, and Rental properties
- **Image Carousels**: Swiper.js integration for property photos
- **Smart Filtering**: Filter by deal type, market, price, bedrooms, bathrooms, and square footage
- **Tiered Access**: Role-based content visibility
- **Authentication**: Clerk-powered signup/login
- **Salesforce Integration**: Direct API connection to transaction data
- **Cloudinary Images**: Optimized image delivery
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Authentication**: Clerk
- **Styling**: Tailwind CSS with custom Cedar branding
- **Images**: Cloudinary CDN
- **Carousels**: Swiper.js
- **CRM**: Salesforce REST API integration
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this project, you'll need:

1. **Clerk Account** - For authentication
2. **Salesforce Org** - With a connected app for API access
3. **Cloudinary Account** - For image management
4. **Node.js 18+** and npm/yarn

## 🔧 Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cedar-property-listings
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with the following credentials:

### Clerk Configuration
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Salesforce Configuration
```env
SALESFORCE_CLIENT_ID=your_consumer_key
SALESFORCE_CLIENT_SECRET=your_consumer_secret
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_password
SALESFORCE_SECURITY_TOKEN=your_security_token
SALESFORCE_INSTANCE_URL=https://your-domain.salesforce.com
```

### Cloudinary Configuration
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🎯 Salesforce Setup

### Required Custom Fields on Transaction__c Object:

**Property Information:**
- `Description__c` (Long Text Area)
- `Street_Address__c` (Text)
- `City__c` (Text)
- `State__c` (Text)
- `Zip_Code__c` (Text)
- `Parish__c` (Text)
- `Bedrooms__c` (Number)
- `Bathrooms__c` (Number)
- `Square_Feet__c` (Number)
- `Lot_Size__c` (Number)
- `Year_Built__c` (Number)
- `Property_Type__c` (Picklist)

**Deal Information:**
- `Deal_Type__c` (Picklist: Fix & Flip, Wholesale, Rental)
- `Market__c` (Picklist: Lafayette, Baton Rouge, Other)
- `List_Price__c` (Currency)
- `Purchase_Price__c` (Currency)
- `Status__c` (Picklist: Available, Under Contract, Sold, Off Market)

**Access Control:**
- `Access_Tier__c` (Picklist: public, registered, vip)
- `Is_Off_Market__c` (Checkbox)

**Flip Metrics:**
- `ARV__c` (Currency) - After Repair Value
- `Rehab_Estimate__c` (Currency)
- `Spread__c` (Currency)
- `ROI__c` (Percent)

**Rental Metrics:**
- `Gross_Yield__c` (Percent)
- `Cap_Rate__c` (Percent)
- `Monthly_Rent__c` (Currency)

**Additional Fields:**
- `Tags__c` (Text)
- `Notes__c` (Long Text Area)
- `Showing_Instructions__c` (Long Text Area)

### Required Custom Fields on Lead Object:
- `Investor_Type__c` (Picklist)
- `Interests__c` (Text)
- `Website_User_ID__c` (Text) - To store Clerk user ID

## 🔄 Webhook Setup

### Clerk Webhook
1. In your Clerk Dashboard, go to Webhooks
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`
4. Copy the webhook secret to your environment variables

## 🚀 Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── properties/          # Property API routes
│   │   └── webhooks/clerk/      # Clerk webhook handler
│   ├── listings/                # Main listings page
│   └── layout.tsx               # Root layout with Clerk
├── components/
│   ├── ui/                      # Reusable UI components
│   └── property/                # Property-specific components
├── lib/
│   ├── salesforce.ts            # Salesforce API client
│   ├── cloudinary.ts            # Cloudinary utilities
│   └── utils.ts                 # Helper functions
└── types/
    ├── property.ts              # Property-related types
    ├── user.ts                  # User and auth types
    └── index.ts                 # Type exports
```

## 🎨 Branding

Cedar Sells brand colors:
- Primary Green: `#05622E`
- Logo Green: `#019342`
- Dark Green: `#044922`
- Text: `#212529`

Fonts:
- Display/Headlines: Bebas Neue
- Body/UI: Inter

## 📱 Access Tiers

### Public Users
- View property listings with limited information
- Address shows only "Address available after registration"
- Limited deal metrics
- Cannot view off-market properties

### Registered Users
- Full property details including exact addresses
- Complete deal metrics and ROI information
- Showing instructions and notes
- Cannot view VIP/off-market properties

### VIP Users
- All registered user benefits
- Access to off-market deals
- Priority deal notifications
- Advanced metrics and analytics

## 🔐 Security Features

- Server-side authentication with Clerk
- Protected API routes
- Webhook signature verification
- Environment variable protection
- Access-tier based data filtering

## 📊 Data Flow

1. **Property Data**: Salesforce Transaction__c → API → Frontend
2. **User Registration**: Clerk → Webhook → Salesforce Lead creation
3. **Images**: Cloudinary → Optimized delivery → Frontend
4. **Access Control**: Clerk user metadata → API filtering → Content visibility

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables in Vercel
Add all variables from `.env.local` to your Vercel project settings.

## 📞 Support

For technical support or questions about this application:

**Cedar Sells**
- Phone: (337) 420-0375
- Website: [cedarcashhomebuyers.com](https://cedarcashhomebuyers.com)
- Markets: Lafayette, Baton Rouge, and surrounding Acadiana parishes

## 📄 License

This project is proprietary to Cedar Sells.
