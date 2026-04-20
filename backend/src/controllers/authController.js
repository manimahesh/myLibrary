const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../utils/auth');

async function register(req, res) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create(email, passwordHash);

    res.status(201).json({ user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateMe(req, res) {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.updateProfile(req.user.userId, value.first_name, value.last_name);
    res.json({ user });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function changePassword(req, res) {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fullUser = await User.findByEmail(
      (await User.findById(req.user.userId)).email
    );
    if (!fullUser) return res.status(404).json({ error: 'User not found' });

    const valid = await comparePassword(value.current_password, fullUser.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const newHash = await hashPassword(value.new_password);
    await User.updatePassword(req.user.userId, newHash);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login, getMe, updateMe, changePassword };
