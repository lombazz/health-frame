# HealthFrame

A Next.js web application that allows users to upload blood test results and receive AI-powered educational insights with trend visualization.

## Features

- **Upload Lab Results**: Input demographics and lab values through an intuitive form
- **AI Analysis**: Get educational summaries and insights from OpenAI (not medical advice)
- **Trend Visualization**: View charts showing changes in lab values over time
- **Dashboard**: Track upload history with quick summaries and sparklines
- **Responsive Design**: Clean, minimalist Bending Spoons-style UI with emerald accents

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom component library)
- **Charts**: Recharts
- **Validation**: Zod
- **AI**: OpenAI API
- **Data**: In-memory storage (ready for Supabase migration)
- **Font**: Inter via Google Fonts

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lombazz/health-frame.git
cd health-frame
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload Lab Results

- Navigate to `/upload`
- Enter demographics (sex, birth year, height, weight)
- Input lab values for supported analytes:
  - LDL Cholesterol
  - HDL Cholesterol  
  - Triglycerides
  - Glucose
  - HbA1c
  - Hemoglobin
- Optionally add reference ranges
- Click "Analyze Results"

### 2. View Reports

- After analysis, you'll be redirected to `/report/[id]`
- View overall health score and AI summary
- See individual analyte results with status indicators
- Review trend charts (after multiple uploads)
- Read important disclaimers

### 3. Dashboard

- Visit `/dashboard` to see all past uploads
- Quick overview with scores and flags
- Mini sparklines for key analytes
- Click "View Report" to see detailed analysis

## API Endpoints

### POST /api/analyze

Analyzes lab results using OpenAI and stores the data.

**Request Body:**
```json
{
  "demographics": {
    "sex": "M",
    "birth_year": 1990,
    "height_cm": 175,
    "weight_kg": 70
  },
  "lab_results": [
    {
      "analyte": "LDL",
      "value": 130,
      "unit": "mg/dL",
      "ref_low": 0,
      "ref_high": 129
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "upload_id": "abc123",
  "report_id": "def456"
}
```

## UI Components

The app features a custom component library built with pure Tailwind CSS:

- **Container**: Centered layout with consistent max-width
- **Navbar**: Clean navigation with logo and links
- **Footer**: Minimalist footer with muted text
- **Button**: Rounded buttons with primary (emerald) and secondary variants
- **Card**: Clean cards with rounded corners and soft shadows
- **StatusChip**: Color-coded status indicators (low=amber, normal=emerald, high=rose)

## Data Storage

Currently uses in-memory storage for development. To migrate to Supabase:

1. Set up Supabase project
2. Create tables for `uploads` and `reports`
3. Replace functions in `lib/repo.ts`
4. Update environment variables

## Important Disclaimers

⚠️ **This application is for educational purposes only and does not provide medical advice. Always consult with qualified healthcare professionals for medical decisions.**

- AI responses are educational and informational
- Not intended for medical diagnosis or treatment
- Lab reference ranges may vary between laboratories
- Results should be interpreted by healthcare providers

## Development

### Project Structure

```
health-frame/
├── app/
│   ├── (ui)/components/   # Custom UI component library
│   ├── api/analyze/       # OpenAI analysis endpoint
│   ├── dashboard/         # Upload history page
│   ├── report/[id]/       # Individual report page
│   ├── upload/            # Lab upload form
│   ├── layout.tsx         # Root layout with nav
│   └── page.tsx           # Landing page
├── lib/
│   ├── openai.ts          # OpenAI client setup
│   ├── repo.ts            # Data storage layer
│   ├── utils.ts           # Utility functions
│   └── validation.ts      # Zod schemas
└── tailwind.config.js     # Tailwind configuration
```

### Key TODOs

- [ ] Replace in-memory storage with Supabase
- [ ] Add user authentication
- [ ] Implement data persistence
- [ ] Add more lab analytes
- [ ] Enhanced error handling
- [ ] Unit tests
- [ ] Performance optimization

## License

MIT License - see LICENSE file for details.
