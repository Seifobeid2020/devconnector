const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult, body } = require("express-validator");
const normalize = require("normalize-url");
const axios = require("axios");
const config = require("config");
const request = require("request");
const { response } = require("express");
const e = require("express");
// @route       GET api/profile/me
// @desc        GET current user profile
// @access      Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "there is no profile for this user" });
    }
    res.json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error with profile" });
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    const profileFields = {
      user: req.user.id,
      company,
      location,
      website:
        website && website !== ""
          ? normalize(website, { forceHttps: true })
          : "",
      bio,
      skills: Array.isArray(skills)
        ? skills
        : skills.split(",").map(skill => " " + skill.trim()),
      status,
      githubusername,
    };

    // Build social object and add to profileFields
    const socialfields = { youtube, twitter, instagram, linkedin, facebook };

    for (const [key, value] of Object.entries(socialfields)) {
      if (value && value.length > 0)
        socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json(profile);
      }
      // Creat New Profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route       GET api/profile/
// @desc        GET all profiles from users
// @access      Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.status(400).json({ msg: "there is no profiles " });
    }
    res.json(profiles);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error with profile" });
  }
});

// @route       GET api/profile/user/:user_id
// @desc        GET a user profile
// @access      Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profiles = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.status(400).json({ msg: "Profile not found " });
    }
    res.json(profiles);
  } catch (error) {
    console.log(error.message);
    if (error.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile not found " });
    res.status(500).json({ msg: "Server Error with profile" });
  }
});

// @route       DELETE api/profile/
// @desc        Delete user and profile
// @access      Private

router.delete("/", auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User Removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error with profile" });
  }
});

// @route       PUT api/profile/experience
// @desc        Add experience from profile
// @access      Private

router.put(
  "/experience",
  auth,
  [
    check("title", "title IS Required").not().isEmpty(),
    check("company", "company IS Required").not().isEmpty(),
    check("from", "from IS Required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res
          .status(400)
          .json({ msg: "there is no profiles from add exp" });
      }
      profile.experience.unshift(newExp);
      await profile.save();

      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server Error with profile" });
    }
  }
);
// @route       DELETE api/profile/experience/:exp_id
// @desc        Delete experience from profile
// @access      Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      exp => exp.id !== req.params.exp_id
    );
    console.log(
      foundProfile.experience.filter(exp => exp.id !== req.params.exp_id)
    );
    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error with experience" });
  }
});

// @route       PUT api/profile/education
// @desc        Add education from profile
// @access      Private

router.put(
  "/education",
  auth,
  [
    check("school", "school IS Required").not().isEmpty(),
    check("degree", "degree IS Required").not().isEmpty(),
    check("fieldofstudy", "fieldofstudy IS Required").not().isEmpty(),
    check("from", "from IS Required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExp = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res
          .status(400)
          .json({ msg: "there is no profiles from add edu" });
      }
      profile.education.unshift(newExp);
      await profile.save();

      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server Error with profile" });
    }
  }
);

// @route       DELETE api/profile/education/:edu_id
// @desc        Delete education from profile
// @access      Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.education = foundProfile.education.filter(
      edu => edu.id !== req.params.edu_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server Error with education" });
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        res.status(404).json({ msg: "No GitHub profile found" });
      }
      res.json(JSON.parse(body));
    });

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: "No Github profile found" });
  }
});

module.exports = router;
