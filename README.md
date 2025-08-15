# HealthFrame

A Next.js web application that allows users to upload blood test results and receive AI-powered educational insights with trend visualization.

## Features

- **Upload Lab Results**: Input demographics and lab values through an intuitive form
- **AI Analysis**: Get educational summaries and insights from OpenAI (not medical advice)
- **Trend Visualization**: View charts showing changes in lab values over time
- **Dashboard**: Track upload history with quick summaries and sparklines
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod
- **AI**: OpenAI API
- **Data**: In-memory storage (ready for Supabase migration)

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
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
└── components/ui/         # shadcn/ui components
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
