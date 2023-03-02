const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

global : day = date.getDate();

app.set("view engine" , "ejs");

app.use(bodyParser.urlencoded({"extended":true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", () => {
  console.log("Connected to MongoDB");
});



const itemsSchema = new mongoose.Schema({
    name: String
});

const Item =  mongoose.model("Item" , itemsSchema);

const item1 = new Item ({
    name : "Welcome to my todo list."
});

const item2 = new Item ({
    name : "Hit the + button to add new item."
});

const item3 = new Item ({
    name : "<-- Hit this to delete an item."
});

const defaultItems = [item1 , item2 , item3];


const listSchema = { 
    name : String,
    items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/" , function(req , res){
    
    Item.find({}, function(err, foundItems){
        
        if (foundItems.length === 0 ) {
            Item.insertMany(defaultItems , function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB");
                }
            });
            res.redirect("/")
        } else {
            res.render("list", {listTitle : day , newlItem : foundItems});
        }

    });
    
});

app.get("/:customListName", function(req, res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if (!err){
            if (!foundList){
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list

                res.render("list", {listTitle : foundList.name , newlItem : foundList.items});
            }
        }
    });


});


app.post("/", function(req ,res){

    const itemName = req.body.newItem ;
    const listName = req.body.list ;

    const item = new Item ({
        name : itemName
    });

    if (listName === day ) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name : listName} , function(err , foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function(req, res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName ;

    if (listName === day) {
        Item.findByIdAndRemove( checkedItemId, function(err){
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            } 
        });
    } else {
        List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}} , function(err, foundList){
            if (!err){
                res.redirect("/" + listName);
            }
        })
    }

});


app.listen(3000 ,function(){
    console.log("server started at port at 3000");
});