const {
  calculateNumberOfCalories,
  restrictedFood,
  getNonRecommendedCategories,
} = require('../functions');
const { BadRequestError } = require('../errors');
const { StatusCodes } = require('http-status-codes');
const UserInfo = require('../models/user-info');
const { User } = require('../models/user-model');

const userCalculateCalories = async (req, res) => {
  const { height, currentWeight, desiredWeight, age, bloodType } = req.body;
  if (!height || !currentWeight || !desiredWeight || !age || !bloodType) {
    throw new BadRequestError(
      'Please provide height, current weight, desired weight, age, and blood type'
    );
  }
  const user = req.user;
  const userInfo = await User.findById(user._id);
  const calories = calculateNumberOfCalories(
    age,
    height,
    currentWeight,
    desiredWeight
  );
  const restrictedProducts = restrictedFood(bloodType);
  const nonRecCategories = getNonRecommendedCategories(restrictedProducts);
  userInfo.nonRecCategories = nonRecCategories;
  userInfo.calories = calories;
  await userInfo.save();
  console.log(userInfo);
  return res.status(StatusCodes.OK).json({ userInfo });
};

module.exports = userCalculateCalories;
