const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
let mockUser = {
  id: 'mock-user-123',
  username: 'testuser',
  hasActiveSubscription: false
};

// Mock subscription plans
const subscriptionPlans = {
  basic: {
    name: 'Basic',
    price: 9.99,
    color: '#3498db',
    description: 'Perfect for casual gamers',
    features: [
      'Access to basic tournaments',
      'Profile customization',
      'Basic statistics',
      'Community access'
    ]
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    color: '#ffd700',
    description: 'Most popular choice for serious gamers',
    popular: true,
    features: [
      'All Basic features',
      'Priority tournament registration',
      'Advanced statistics',
      'Custom profile themes',
      'Exclusive tournaments',
      'VIP Discord access'
    ]
  },
  pro: {
    name: 'Pro',
    price: 39.99,
    color: '#ff1493',
    description: 'For professional esports teams',
    features: [
      'All Premium features',
      'Tournament creation',
      'Team management tools',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access'
    ]
  }
};

// Routes
app.get('/api/subscriptions/plans', (req, res) => {
  res.json({
    success: true,
    data: subscriptionPlans
  });
});

app.get('/api/subscriptions/current', (req, res) => {
  if (!mockUser.hasActiveSubscription) {
    return res.json({
      success: true,
      data: null
    });
  }

  res.json({
    success: true,
    data: {
      id: 'sub-123',
      plan: 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      price: 19.99
    }
  });
});

app.post('/api/subscriptions', (req, res) => {
  const { plan, paymentMethod } = req.body;
  
  if (!subscriptionPlans[plan]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription plan'
    });
  }

  // Simulate subscription creation
  mockUser.hasActiveSubscription = true;
  
  res.json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      id: 'sub-' + Date.now(),
      plan: plan,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      price: subscriptionPlans[plan].price,
      paymentMethod: paymentMethod
    }
  });
});

app.post('/api/subscriptions/cancel', (req, res) => {
  mockUser.hasActiveSubscription = false;
  
  res.json({
    success: true,
    message: 'Subscription cancelled successfully'
  });
});

// Tournament registration endpoint
app.post('/api/tournaments/:id/register', (req, res) => {
  if (!mockUser.hasActiveSubscription) {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required to register for tournaments',
      requiresSubscription: true,
      redirectTo: '/subscription'
    });
  }

  res.json({
    success: true,
    message: 'Successfully registered for tournament'
  });
});

// Test endpoint to toggle subscription status
app.post('/api/test/toggle-subscription', (req, res) => {
  mockUser.hasActiveSubscription = !mockUser.hasActiveSubscription;
  
  res.json({
    success: true,
    hasActiveSubscription: mockUser.hasActiveSubscription,
    message: `Subscription ${mockUser.hasActiveSubscription ? 'activated' : 'deactivated'}`
  });
});

app.get('/api/test/user-status', (req, res) => {
  res.json({
    success: true,
    data: {
      user: mockUser.username,
      hasActiveSubscription: mockUser.hasActiveSubscription
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 User status: ${mockUser.hasActiveSubscription ? 'Has subscription' : 'No subscription'}`);
  console.log(`🔗 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/test/user-status`);
  console.log(`   POST http://localhost:${PORT}/api/test/toggle-subscription`);
  console.log(`   GET  http://localhost:${PORT}/api/subscriptions/plans`);
  console.log(`   POST http://localhost:${PORT}/api/tournaments/test-tournament/register`);
});

module.exports = app;