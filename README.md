# i-Copedia - Industrial Coating Workflow Application

i-Copedia is a specialized application designed to digitize and streamline industrial coating workflows. It replaces manual logs, estimation sheets, and basic tools with a unified app that offers comprehensive job tracking, material calculation, and reporting capabilities.

## About the Project

**Purpose**: i-Copedia aims to improve efficiency and accuracy in industrial coating operations by providing a digital solution for managing all aspects of coating projects.

## Key Features

- **Job & Process Management**: Add, edit, and track coating jobs with real-time status updates
- **BOQ Creation**: Generate structured Bills of Quantities with material details
- **Report Generation**: Create professional reports with job data, materials, and QC feedback
- **Advanced Engineering Tools**: Built-in calculators for DFT/WFT conversions, coverage estimation, and more
- **Product & Equipment Management**: Store and access coating product information and equipment calibration data
- **Tutorial System**: In-app guidance for navigating features and tools

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- React Router
- shadcn-ui components
- Tailwind CSS
- Lucide React icons

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <REPOSITORY_URL>

# Navigate to the project directory
cd icopedia-blog-page

# Install dependencies
npm install

# Start the development server
npm run dev
```

## App Structure

- `/src/components`: UI components including app sections
- `/src/components/ui`: Shadcn UI components
- `/src/hooks`: Custom React hooks
- `/src/pages`: Page components and routing

## Deployment

The application is currently configured for development. For production deployment:

```sh
# Build the project
npm run build

# Preview the production build locally
npm run preview
```

## Contact

For more information about i-Copedia, please contact:
- Email: contact@icopedia.com
- Phone: +91 (022) 1234-5678

# iCOPEDIA Landing Page

This is a landing page for the iCOPEDIA app, designed to showcase the app's features and provide download options.

## Deployment to Vercel

This project is set up for easy deployment to Vercel. Follow these steps:

1. Make sure you have the Vercel CLI installed:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the project:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

## Development

To run the project locally:

```
npm install
npm run dev
```

## Direct App Download

The app download links currently redirect to Google Drive where the APK is hosted. After deploying to Vercel, we'll implement direct download functionality.

## Built With

- React
- Vite
- Tailwind CSS
- Shadcn UI
- Lucide React Icons
