const bcrypt = require('bcrypt')

const Event = require('../../models/event')
const User = require("../../models/user")
const Booking = require("../../models/booking")
const user = require('../../models/user')

const events = async eventIds => {
    try {
        const event = await Event.find({ _id: { $in: eventIds}})

        return event.map(event => {
            return {...event._doc,
                    _id: event.id,
                    date: new Date(event._doc.date).toISOString(),
                    creator: findUser.bind(this, event.creator)
            }
        })
    } catch (error) {
        console.log(error)
        throw error
    }
    
}

const singleEvent = async eventId => {
    try {
        const event = await Event.findById(eventId);
        console.log(event._doc.creator)
        return {...event._doc,
                creator: findUser.bind(this, event._doc.creator)
        }
    } catch (error) {
        throw error
    }
}

const findUser = async userId => {
    try {
        const user = await User.findById(userId)
        return {...user._doc, 
                _id: user.id, 
                createdEvents: events.bind(this, user._doc.createdEvents)
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

module.exports = {
    events: async () => {
        try {
            const result = await Event.find()

            // const populatedCreator = result.map(async event => {
            //     const user = await User.findById(event.creator)
            //     return {...event._doc, creator: user}
            // })

            return result.map(event => {
                return {...event._doc,
                        date: new Date(event._doc.date).toISOString(), 
                        creator: findUser.bind(this, event._doc.creator)}
            })
        } catch (error) {
            console.log(error)
            throw error
        }
        
    },
    bookings: async() => {
        try {
            const bookings = await Booking.find()
            return bookings.map(booking => {
                return{ ...booking._doc,
                        user: findUser.bind(this, booking._doc.user),
                        event: singleEvent.bind(this, booking._doc.event),
                        createdAt: new Date(booking._doc.createdAt).toISOString(),
                        updatedAt: new Date(booking._doc.updatedAt).toISOString()
                }
            })
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
            
            return {...result._doc,
                    creator: findUser.bind(this, result._doc.creator)
            }
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
        
    },
    bookEvent: async args => {
        try {
            const fetchedEvent = await Event.findOne({_id: args.eventId })
            const booking = new Booking({
                user: '6241864af83b79474b521f08',
                event: fetchedEvent
            })
            const result = await booking.save();

            return {...result._doc,
                    user: findUser.bind(this, booking._doc.user),
                    event: singleEvent.bind(this, booking._doc.event),
                    createdAt: new Date(booking._doc.createdAt).toISOString(),
                    updatedAt: new Date(booking._doc.updatedAt).toISOString()
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    cancelBooking: async args => {
        try {
            const booking = await Booking.findById(args.bookingId).populate('event')
            if (!booking) throw new Error('Not Found')
            console.log(booking, args.bookingId)
            const event = {
                ...booking._doc.event,
                creator: findUser.bind(this, booking.event._doc.creator)
            }
            await Booking.findByIdAndDelete(args.bookingId)
            return event._doc
        } catch (error) {
            console.log(error)
            throw error
        }
    }
}