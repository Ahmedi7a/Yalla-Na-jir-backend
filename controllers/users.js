const express = require('express');
// auth
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Models
const User = require('../models/user');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Something went wrongm, try again.' });
    }

    const hashedPassword = bcrypt.hashSync(password, parseInt(process.env.SALT_ROUNDS));

    const user = await User.create({ username, hashedPassword });

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: 'Something wen wrong, try again.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const isValidPassword = bcrypt.compareSync(password, existingUser.hashedPassword);

    if (!isValidPassword) {
      throw Error('Invalid Credentials');
    }

    const token = jwt.sign(
      {
        _id: existingUser._id,
        username: existingUser.username,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({ user: existingUser, token });
  } catch (error) {
    res.status(400).json({ error: 'Something went wrong, try again.' });
  }
});

module.exports = router;
