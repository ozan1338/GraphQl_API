const express = require("express")
const { graphqlHTTP } = require("express-graphql")
const mongoose = require("mongoose")

const graphQlSchema = require('./graphql/schema/index')
const graphQlResolver = require('./graphql/resolvers/index')

const app = express()

app.use(express.json())



app.use('/graphql', graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolver,
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

