/**
 * ========= Packages ==============
 */
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
/**
 * ========= End Packages ==============
 */
/**
 * ========= Util ==============
 */
/**
 * ========= End Util ==============
 */
const { clearImage } = require("../util/file");
/**
 * ========= Models ==============
 */
const User = require("../models/user");
const Post = require("../models/post");
/**
 * ========= End Models ==============
 */

module.exports = {
  createUser: async ({ userInput }, req) => {
    try {
      // Validation data
      const errors = [];
      if (!validator.isEmail(userInput.email)) {
        errors.push({ message: "E-mail is invalid" });
      }

      if (
        validator.isEmpty(userInput.password) ||
        !validator().isLength(userInput.password, { min: 5 })
      ) {
        errors.push({ message: "Password too Short!" });
      }

      if (errors.length > 0) {
        const error = new Error("invalid input");
        error.data = errors;
        errors.code = 422;
        throw error;
      }

      // Chech if user already exists
      const existingUser = await User.findOne({ email: userInput.email });
      if (existingUser) {
        const error = new Error("User exists Already");
        throw error;
      }

      // Hashed password with bcrypt
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
  login: async ({ email, password }) => {
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        const error = new Error("Email Not Found!");
        error.code = 401;
        throw error;
      }

      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const error = new Error("Password is Incorrect!");
        error.code = 404;
        throw error;
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.SECRET,
        { expiresIn: "1h" }
      );

      return {
        token: token,
        userId: user._id.toString(),
      };
    } catch (error) {
      throw error;
    }
  },
  createPost: async ({ postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not Authenticaterd!");
      error.code = 401;
      throw error;
    }
    const errors = [];
    // Validation title
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, {
        min: 5,
      })
    ) {
      errors.push({ message: "Title is Invalid!" });
    }

    // Validation content
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, {
        min: 5,
      })
    ) {
      errors.push({ message: "Content is Invalid!" });
    }

    // Send error if exists
    if (errors.length > 0) {
      const error = new Error("invalid input");
      error.data = errors;
      errors.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Invalid User!");
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });

    const createdPost = await post.save();

    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  post: async ({ postId }) => {
    if (!req.isAuth) {
      const error = new Error("Not Authenticaterd!");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("No Post Found!");
      error.code = 404;
      throw error;
    }

    return {
      ...pos._doct,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async ({ id, postInput }) => {
    if (!req.isAuth) {
      const error = new Error("Not Authenticaterd!");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const error = new Error("No Post Found!");
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not Authorized!");
      error.code = 404;
      throw error;
    }

    // Validation title
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, {
        min: 5,
      })
    ) {
      errors.push({ message: "Title is Invalid!" });
    }

    // Validation content
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, {
        min: 5,
      })
    ) {
      errors.push({ message: "Content is Invalid!" });
    }

    // Send error if exists
    if (errors.length > 0) {
      const error = new Error("invalid input");
      error.data = errors;
      errors.code = 422;
      throw error;
    }

    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  deletePost: async ({ id }) => {
    try {
      if (!req.isAuth) {
        const error = new Error("Not Authenticaterd!");
        error.code = 401;
        throw error;
      }

      const post = await Post.findById(id);

      if (!post) {
        const error = new Error("No Post Found!");
        error.code = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId.toString()) {
        const error = new Error("Not Authorized!");
        error.code = 404;
        throw error;
      }
      clearImage(post.imageUrl);

      await Post.findByIdAndRemove(id);
      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();

      return true;
    } catch (error) {
      return false;
    }
  },
};
