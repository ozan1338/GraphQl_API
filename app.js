const express = require("express")
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require('graphql')
const mongoose = require("mongoose")
const bcrypt = require('bcrypt')

const Event = require('./models/event')
const User = require("./models/user")


const app = express()
app.use(express.json())

const events = [];

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: async () => {
            try {
                const result = await Event.find()

                const populatedCreator = result.map(async event => {
                    const user = await User.findById(event.creator)
                    return {...event._doc, creator: user.email}
                })

                return populatedCreator
            } catch (error) {
                console.log(error)
                throw error
            }
            
        },
        createEvent: async(args) => {
            try {
                const user = await User.findById('6241864af83b79474b521f08')
                
                if(!user) {
                    throw new Error('User not found')
                }

                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: args.eventInput.price,
                    date: new Date().toISOString(),
                    creator: '6241864af83b79474b521f08'
                })
                const result = await event.save();
                
                user.createdEvents.push(event)
                
                await user.save()
                
                return {...result._doc}
            } catch (error) {
                console.log(error)
                throw error;
            }
            
        },
        createUser: async args => {
            try {
                const isExist = await User.findOne({
                    email: args.userInput.email
                })

                if (isExist) {
                    throw new Error('User exist')
                }

                const hashPassword = await bcrypt.hash(args.userInput.password, 12)
                const user = new User({
                    email: args.userInput.email,
                    password: hashPassword
                });

                const result = await user.save();

                return {...result._doc, password: null}
            } catch (error) {
                console.log(error)
                throw error;
            }
            
        }
    },
    graphiql: true
}))

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.d2tbv.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(() => {
    app.listen(3001, ()=>{
        console.log("Server listening on port 3001")
    })
})
.catch(err => {
    console.log(err)
})

