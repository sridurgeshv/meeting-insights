# Adaptive Meeting Insight Dashboard
The Adaptive Meeting Insight Dashboard is a web application that processes meeting recordings to extract key insights such as transcriptions, action items, key decisions, and more. It leverages AI to generate smart highlights and allows users to interact with meeting data through Q&A and other features.

## Overview
This dashboard simplifies meeting analysis by providing users with actionable insights, automated transcription, and an intuitive interface for exploring meeting data. Users can upload recordings, extract key insights, and interact with the data to maximize productivity.

## Key Features
- Upload Meeting Recordings: Drag-and-drop or browse files to upload meeting recordings.
- Automated Transcriptions: Generate accurate transcriptions from uploaded videos.
- Smart Highlights: Automatically extract actionable items, key decisions, and questions from the transcription.
- Interactive Q&A: Ask specific questions based on the transcription and receive precise answers.
- Dynamic Title Generation: Generate a meaningful title for each meeting session automatically.
- Session Management: Save, edit, and navigate through previously analyzed sessions.

## Why Choose Our App?
- Time-Saving: Automatically extract critical information from meeting recordings, reducing manual effort.

- Enhanced Collaboration: Share summaries, action items, and decisions with your team for better alignment.

- Accurate Insights: Advanced AI ensures precise transcription and context-aware analysis.

- User-Friendly Interface: Intuitive design for easy navigation, even for non-technical users.

- Customizable Workflow: Tailor the dashboard to your specific workflow requirements.

- Secure Environment: Built with robust authentication and secure data handling practices.

Our app goes beyond transcription by offering actionable insights to streamline your team's productivity and decision-making processes.

## Getting Started
Follow the instructions below to set up the project on your local machine.

## Prerequisites
- Node.js and npm installed on your machine.
- An API Key from Groq
- Gemini API key
- ffmpeg installed in your system
  
  For windows user watch this video to install ffmpeg  [Ffmpeg](https://youtu.be/mEV5ZRqaWu8?si=vNPZBqYU2TxqgC2y)

  For linux or ubuntu based system run these commands
  
sudo apt update
sudo apt install ffmpeg


  

##  API Key Setup

1. Visit the [Gemini](https://g.co/kgs/rt8LbjZ) to get your API Key and paste it in the .env file in backend directory.
   
 4. Visit the [Groq](https://groq.com/) and click on "FREE API KEY. Sign in and get your API Key and paste it in the .env file in backend directory.
   

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sridurgeshv/meeting-insights.git
cd meeting-insights
```

### Frontend Setup

- Set up the frontend:
```bash
cd frontend
npm install
```

### Backend Setup

- Set up the backend:
```bash
cd backend
npm install
```

4. Start the development server:
```bash
npm start
```

5. Run the backend server (ensure the necessary API endpoints are available):
```bash
npm run dev
```

## Usage

Open your web browser and navigate to http://localhost:3000 to access the application.

## Contact

For questions, feedback, or support, please contact us:

- Email: sridurgeshv@gmail.com, ritikasrivastava456@gmail.com
- Project Repository: https://github.com/sridurgeshv/meeting-insights
  
## Video Demo
For a comprehensive overview of the application's features and functionality, please watch our [video demonstration](). This walkthrough provides detailed guidance on effectively using and navigating Insightsync.
