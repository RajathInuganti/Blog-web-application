var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Campground = require('./models/campgrounds');
var seedDB = require('./seeds');
var Comment = require('./models/comment');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('./models/user');

seedDB();


mongoose.connect("mongodb://localhost/yelp_camp", {
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() => {
	console.log("connection to database: successful");
}).catch(err => {
	console.log("ERROR: "+ err);
});



app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(require('express-session')({
	secret: "This is the YelpCamp server side code frameworks",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//you can do this to send currentUser to every page that has a navbar
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});

//or you could just do:
// res.render("campgrounds/campgrounds", {campgrounds: allCampgrounds, currentUser: req.user});
// in every route that has a navbar.


//RESTful Routes

app.get("/", function(req, res){
	res.render("landing");
});

app.get("/campgrounds", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log("ERROR: "+ err);
		}
		else{
			res.render("campgrounds/campgrounds", {campgrounds: allCampgrounds});
		}
	});
});

app.post("/campgrounds", function(req, res){
	var name = req.body.name;
	var image = req.body.image;
	var desc = req.body.desc;
	var campground = {name: name, image: image, desc: desc};
	Campground.create(campground, function(err, campground){
		if(err){
			console.log("ERROR: "+err);
		}
		else{
			res.redirect("/campgrounds");
		}
	});
});

app.get("/campgrounds/new", function(req, res){
	res.render("campgrounds/new");
});

app.get("/campgrounds/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		}
		else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});



app.get("/campgrounds/:id/comments/new", isLoggenIn,function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("comments/new", {campground: foundCampground});
	});	
});

app.post("/campgrounds/:id/comments", isLoggenIn,function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		}
		else{
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				}
				else{
					campground.comments.push(comment);
					campground.save();
					res.redirect("/campgrounds/" + campground._id); 
				}
			});
		}
	});
});

//Auth - RESTful routes

app.get("/register", function(req, res){
	res.render("register");
});

app.post("/register", function(req, res){
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		else{
			passport.authenticate("local")(req, res, function(){
				res.redirect("/campgrounds");
			});
		}
	});
});

//show login form

app.get("/login", function(req, res){
	res.render("login");
});

// when a post request is received the middleware is first executed before the callback. the middleware here is checking if the user is successully authenticated or not. if yes he is taken to the page intended or if not the user stays back on the login page.
app.post("/login", passport.authenticate("local", {
		successRedirect: "/campgrounds",
		failureRedirect: "/login"
	}),
	function(req, res){
	
});

app.get("/logout", function(req, res, next){
	req.logout();
	res.redirect("/campgrounds");
});

//middleware for verifying if a user is logged in or not. if not it redirects to login page.
function isLoggenIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		res.redirect("/login");
	}
}



app.listen(3000, process.env.IP, function(){
	console.log("YelpCamp Server has started!");
});
