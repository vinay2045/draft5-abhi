# Travel Agency Application

A complete travel agency application with an admin panel to manage tours, flight bookings, and customer inquiries.

## Features

- 🏠 **Public Website**: Showcase tours, packages, and services
- 🔒 **Admin Panel**: Dashboard for managing all aspects of the business
- 🧑‍💼 **User Management**: Authentication and authorization for admins
- 🌍 **Tour Management**: Create, edit, and manage domestic and international tours
- ✈️ **Flight Bookings**: Handle flight inquiry submissions
- 📝 **Form Submissions**: Track and manage contact form submissions
- 📊 **Statistics Dashboard**: View insights and analytics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Boxicons

## Project Structure

```
├── admin/                # Admin panel frontend
│   ├── css/              # Admin CSS styles
│   ├── js/               # Admin JavaScript files
│   ├── dashboard.html    # Admin dashboard
│   └── login.html        # Admin login page
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication middleware
│   └── upload.js         # File upload middleware
├── models/               # Mongoose models
├── routes/               # API routes
├── scripts/              # Utility scripts
│   └── createAdmin.js    # Script to create first admin user
├── uploads/              # Uploaded files directory
├── .env                  # Environment variables (not versioned)
├── .env.example          # Example environment variables
├── package.json          # Project dependencies
├── server.js             # Main server file
└── README.md             # This file
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/travel-agency.git
   cd travel-agency
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Create admin user**:
   ```bash
   node scripts/createAdmin.js
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Public site: `http://localhost:5000`
   - Admin panel: `http://localhost:5000/admin`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login for users
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/user` - Get current user profile
- `GET /api/auth/admin` - Get current admin profile

### Tours
- `GET /api/domestic-tours` - List all domestic tours
- `GET /api/domestic-tours/:id` - Get a specific domestic tour
- `POST /api/domestic-tours` - Create a new domestic tour (admin only)
- `PUT /api/domestic-tours/:id` - Update a domestic tour (admin only)
- `DELETE /api/domestic-tours/:id` - Delete a domestic tour (admin only)

### Form Submissions
- `POST /api/submissions/contact` - Submit contact form
- `POST /api/submissions/flight` - Submit flight inquiry
- `POST /api/submissions/tour` - Submit tour inquiry

### Admin Dashboard
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/recent-submissions` - Get recent form submissions
- `GET /api/admin/submission/:type/:id` - Get submission details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/travel-agency](https://github.com/yourusername/travel-agency) #   a b h i - d r a f t 2  
 #   a b h i - d r a f t 2  
 #   a b h i - d r a f t 2  
 #   a b h i - d r a f t 2  
 