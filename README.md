#Node.js Hackathon Starter

###Hackathon Documentation

Node.js Authentication:
http://scotch.io/tutorials/javascript/easy-node-authentication-setup-and-local

Mongoose Docs:
http://mongoosejs.com/docs/


###MongoDB


#####Start up the server

$ sudo mongod
#####Local Mongo shell

$ mongo


	Use a database

	> use <database>


	Show all db's

	> show dbs


	Show all collections

	> show collections


	Query all users

	> db.users.find()


	Find Specific User

	> db.users.findOne({linkedin_email:'jordeenchang@gmail.com'})


	Drop Specific collection

	> db.users.drop()


	Find All people in Bay Area

	> db.allpeoples.find({location: "San Francisco Bay Area"})