# Crime Reporting System

This project is a web-based application designed to facilitate the reporting and management of crime incidents. It provides features for users to report crimes, view incidents on a map, and for administrators to manage and analyze crime data.

## Features

- User authentication and authorization.
- Crime reporting with location and image uploads.
- Interactive map to view and filter crime incidents.
- Admin dashboard for managing incidents and viewing analytics.

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database

### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd crime-reporting-system
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up the environment variables:
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
   NEXTAUTH_SECRET=<your-secret>
   NEXTAUTH_URL=http://localhost:3000
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Folder Structure

- `app/`: Contains Next.js pages and layouts.
- `components/`: Reusable React components.
- `constants/`: Static constants used across the app.
- `hooks/`: Custom React hooks.
- `lib/`: Utility functions and libraries.
- `prisma/`: Database schema and migrations.
- `public/`: Static assets.
- `styles/`: Global and component-specific styles.
- `types/`: TypeScript type definitions.
- `utils/`: Helper functions.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
