# Lab Task 3: Express + EJS + MongoDB Authentication App

## Features
- User registration and login with hashed passwords
- Session-based authentication using express-session
- Protected route `/my-orders` to view user-specific orders
- EJS templating and basic styling

## Setup
1. **Install dependencies:**
   ```
   npm install
   ```
2. **Set up MongoDB:**
   - Make sure MongoDB is running locally or provide a connection string.
   - Create a `.env` file in the root with:
     ```
     MONGODB_URI=mongodb://localhost:27017/labtask3auth
     SESSION_SECRET=yourSecretKey
     ```
3. **Run the app:**
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```

4. **Visit** [http://localhost:4000](http://localhost:4000)

## Usage
- Register a new user, then log in.
- Access `/my-orders` to view your orders (if any).
- Log out with the logout link. 