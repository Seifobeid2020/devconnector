const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const checkObjectId = require("../../middleware/checkObjectId");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route       POST api/posts
// @desc        Create a post
// @access      Public

router.post(
  "/",
  auth,
  [check("text", "Text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server Error with posts" });
    }
  }
);

// @route       GET api/posts
// @desc        See all posts
// @access      Priveate
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error posts" });
  }
});

// @route       GET api/posts/:post_id
// @desc        Get a posts
// @access      Priveate
router.get("/:post_id", auth, checkObjectId("post_id"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: "Post Not Found" });
    }
    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error posts" });
  }
});

// @route       DELETE api/posts/:post_id
// @desc        DELETE a post
// @access      Priveate
router.delete("/:post_id", auth, checkObjectId("post_id"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: "Post Not Found" });
    }
    //Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await post.remove();
    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error posts" });
  }
});

// @route       PUT api/posts/like/:post_id
// @desc        Like a post
// @access      Priveate
router.put(
  "/like/:post_id",
  auth,
  checkObjectId("post_id"),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).json({ msg: "Post Not Found" });
      }
      //Check if the post has already been liked
      if (
        post.likes.filter(like => like.user.toString() === req.user.id).length >
        0
      ) {
        return res.status(400).json({ msg: "Post already liked" });
      }
      post.likes.unshift({ user: req.user.id });
      await post.save();

      return res.json(post.likes);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server error posts" });
    }
  }
);

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put("/unlike/:id", [auth, checkObjectId("id")], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not yet been liked
    if (!post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  "/comment/:id",
  [
    auth,
    checkObjectId("id"),
    [check("text", "Text is required").not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// @route       GET api/posts/my
// @desc        Get a posts
// @access      Priveate
// router.get("/my", auth, async (req, res) => {
//   try {
//     const posts = await Post.find({ user: req.user.id });

//     res.json(posts);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ msg: "Server error posts" });
//   }
// });
module.exports = router;
