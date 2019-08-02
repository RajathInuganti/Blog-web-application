var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Campground = require('./models/campgrounds');
var seedDB = require('./seeds');
var Comment = require('./models/comment');

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
			console.log(foundCampground);
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});



app.get("/campgrounds/:id/comments/new", function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("comments/new", {campground: foundCampground});
	});	
});

app.post("/campgrounds/:id/comments", function(req, res){
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


app.listen(3000, process.env.IP, function(){
	console.log("YelpCamp Server has started!");
});
