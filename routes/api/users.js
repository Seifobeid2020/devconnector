const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
// @route       POST api/users
// @desc        Register user
// @access      Public

router.post(
	"/",
	[
		check("name", "Name is required").not().isEmpty(),
		check("password", "Password is required and Min digets is 6").isLength({
			min: 6
		}),
		check("email", "Email is required").isEmail()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password, name } = req.body;
		try {
			let user = await User.findOne({ email });

			console.log("this is the user :", user);
			//Check if the user already exists
			if (user) {
				return res.status(400).json({ errors: [{ msg: "User Already Exists" }] });
			}
			//Get users gravatar
			const avatar = gravatar.url(email, {
				s: "200",
				r: "pg",
				d: "mm"
			});
			user = new User({
				name,
				password,
				email,
				avatar
			});
			// Encrypt password
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			await user.save();
			//  Retrun jsonwebtoken
			const payload = {
				user: {
					id: user.id
				}
			};
			jwt.sign(payload, config.get("jwtSecret"), { expiresIn: 360000 }, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});

			//   res.send(" user Registered");
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Server Error");
		}
	}
);
module.exports = router;
