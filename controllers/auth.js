const { User, userSchema } = require('../models/user-model');
const { StatusCodes } = require('http-status-codes');
const {
  BadRequestError,
  UnauthenticatedError,
  ConflictError,
} = require('../errors');
require('../models/pass-config');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;

const register = async (req, res) => {
  const body = req.body;
  const { name, email, password } = body;
  if (!name || !email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (user) {
    throw new ConflictError('Email in use');
  }
  const { error } = userSchema.validate(body);

  if (error) {
    console.error(error.message);
    throw new BadRequestError(`Bad Reques. ${error.message} `);
  }

  const createdUser = new User({
    name,
    email,
    password,
  });
  createdUser.setPass(password);
  const payload = {
    id: createdUser.id,
    email: createdUser.email,
    admin: false,
  };
  const token = jwt.sign(payload, SECRET, { expiresIn: '1w' });
  createdUser.setToken(token);
  await createdUser.save();
  res.status(StatusCodes.CREATED).json({ user: { name, email }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const isSamePass = user.isSamePass(password);
  if (isSamePass) {
    const payload = {
      id: user.id,
      email: user.email,
      admin: false,
    };

    const isPasswordCorrect = await user.isSamePass(password);
    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('Invalid Credentials');
    }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1w' });
    user.setToken(token);
    await user.save();
    res
      .status(StatusCodes.OK)
      .json({ user: { name: user.name, email }, token });
  }
};

const logout = async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new UnauthenticatedError('Not authorized');
  }
  const decodedToken = jwt.verify(token.replace('Bearer ', ''), SECRET);
  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new UnauthenticatedError('Not authorized');
  }
  user.token = null;
  await user.save();
  return res.status(204).send();
};

const refreshUser = async (req, res) => {
  const user = req.user;
  console.log(user);
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  return res.status(200).json({ user });
};

module.exports = {
  register,
  login,
  logout,
  refreshUser,
};
