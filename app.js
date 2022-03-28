const express = require("express")
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require('graphql')
const mongoose = require("mongoose")

const Event = require('./models/event')


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
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
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
                return result.map(event => {
                    return {...event._doc}
                })
            } catch (error) {
                console.log(error)
                throw error
            }
            
        },
        createEvent: async(args) => {
            try {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: args.eventInput.price,
                    date: new Date().toISOString()
                })
                const result = await event.save();
                return {...result._doc}
            } catch (error) {
                console.log(error)
                throw err;
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

