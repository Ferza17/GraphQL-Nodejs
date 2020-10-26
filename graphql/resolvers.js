/**
 * ========= Packages ==============
 */
const bcrypt = require("bcryptjs");
/**
 * ========= End Packages ==============
 */
/**
 * ========= Models ==============
 */
const User = require("../models/user");
/**
 * ========= End Models ==============
 */

module.exports = {
  createUser: async function ({ userInput }, req) {
    try {
      const existingUser = await User.findOne({ email: userInput.email });

      if (existingUser) {
        const error = new Error("User exists Already");
        throw error;
      }

      const hashedPW = await bcrypt.hash(userInput.password, 12);
      const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPW,
      });
      const createdUser = await user.save();

      return {
        ...createdUser._doc,
        _id: createdUser._id.toString(),
      };
    } catch (error) {
      throw error;
    }
  },
};
