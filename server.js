const { Server } = require("socket.io");
const express = require("express")
const db = require("./database");
const fs = require("fs")
const app = express()
let usersNames = ""
const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }});

  io.use((socket, next) => {
    
    socket.on('message', (data) => {
      const rum = Array.from(socket.rooms)
         const Log = {
          meddelande: data,
          rum: rum[1],
          namn: usersNames,
          unikId: socket.id,
          datum: new Date().toLocaleString()
         }
        console.log(Log.meddelande)
        if (Log.meddelande.length > 0){
          fs.appendFile("logChat.txt", JSON.stringify(Log) +"\n", (error) => {
            if (error) {
              console.log(error)
            }
          })
          console.log("Skrivit till filen")
        } else {
          console.log("Filen har inte skrivits")
        }
       
    })
    next();

})


io.on("connection", (socket) => {
  console.log(`Socket med id't ${socket.id} har anslutit`)
  socket.on("new user", (data) =>{
    usersNames = data
  })
 
     const rooms = "SELECT room FROM messages GROUP BY room"
    db.all(rooms, (error, rows)=> {
      if(error){
        console.log({Nummer: "5", error: error.message})
    }
    io.emit("rooooms", rows)
    })
    
    
 
//skapa rum
socket.on("create_room", (data) => {
  const rooms = `SELECT room FROM messages WHERE room = "${data}"`
  db.all(rooms, (error, rows)=> {
      if(error){ console.log({Nummer: "4", error: error.message})}
   if(rows.length >= 1) {
      return (socket.emit("error", {location: "create", error: "Chattrummet är redan upptaget"}))
    } else if (data.length === 0)
    {return socket.emit("error", {location: "create", error: "Du kan inte lämna fältet tomt"})}
    else {
    socket.emit("error", null)
    db.run('INSERT INTO messages(userID, room ,name) VALUES(?,?,?)', [socket.id, data,usersNames], (err) => {
      if(err) {
        return console.log(err.message); 
      }
    }) 
    const rooms = "SELECT room FROM messages GROUP BY room"
    db.all(rooms, (error, rows)=> {
      if(error){
        console.log({Nummer: "4", error: error.message})
    }
    io.emit("rooooms", rows)
    })
    } 
  })
})
   
    


//Joina rum
  socket.on("join_room", (data) => {
 

    socket.join(data);

    const vilkaRUm = Array.from(socket.rooms)
    if (vilkaRUm.length >= 3) {
      // Skriver sedan ut vilka rum socketen är med i efteråt
      console.log("Leave", socket.rooms)
      socket.leave(vilkaRUm[1])
      console.log(`${socket.id} gått med i rum ${data}`)
      socket.emit("activeRoom", data)
      
      const chatRooms = "SELECT room FROM messages WHERE message IS NOT NULL"
      db.all(chatRooms, (error, rows) =>{
  
        if(error){
          console.log({Nummer: "6", error: error.message})
        }
        /* socket.emit("new data", rows); DELETE?*/ 
      })
      
      const sql = `SELECT * FROM messages WHERE room = "${data}" AND message IS NOT NULL`
      db.all(sql, (error, rows) =>{
          if(error)
          console.log({Nummer: "7", error: error.message})
          io.to(data).emit("joined_room", rows);
        })

    } else {
      console.log(`${socket.id} gått med i nytt rum ${data}`)
      socket.emit("activeRoom", data)
      const chatRooms = "SELECT room FROM messages WHERE message IS NOT NULL"
      db.all(chatRooms, (error, rows) =>{
  
        if(error){
        console.log({error: error.message})
        }
        socket.emit("new data", rows)
      })

      const sql = `SELECT * FROM messages WHERE room = "${data} AND message IS NOT NULL"`
      const params = []
      db.all(sql,params, (error, rows) =>{
  
          if(error){
          console.log({Nummer: "1", error: error.message})
          }
          io.to(data).emit("joined_room", rows);
        })   
    }

    socket.on("leave_room", (data) => {
    const roomsJoined = Array.from(socket.rooms)
    console.log(data, roomsJoined) 
    console.log(`${socket.id} has left room ${data}`)
    const deleteRooms = `DELETE FROM messages WHERE room = "${roomsJoined[1]}"`
    
    db.all(deleteRooms, (error) =>{
      if(error) {
      console.log({Nummer: "2", error: error.message})
    }
      })
        
     const rooms = "SELECT room FROM messages GROUP BY room"
    db.all(rooms, (error, rows)=> {
      if(error){
        console.log({Nummer: "3", error: error.message})
    }
    io.emit("leave_room", rows)
    })
      socket.leave(data);
    })
  })


  socket.on("message", (data) => {
     const roomsJoined = Array.from(socket.rooms)
    
    const date = new Date().toLocaleString()
     if(roomsJoined.length === 1 || data.length === 0){
      { return socket.emit("error", {location: "message", error:"Du kan inte lämna fältet tomt"});}
     } 

     db.run('INSERT INTO messages(userID, room ,name, message, timestamp) VALUES(?,?,?,?,?)', [socket.id, roomsJoined[1] ,usersNames, data, date], (err) => {
      if(err) {
        return console.log(err.message); 
      }
      const sql = `SELECT * FROM messages WHERE room = "${roomsJoined[1]}" AND message IS NOT NULL`

    db.all(sql, (error, rows) =>{
        
        if(error){console.log({error: error.message})}
        io.to(roomsJoined[1]).emit("message", rows) 
    })
    })
     
    const rooms = "SELECT room FROM messages GROUP BY room"
    db.all(rooms, (error, rows)=> {
      if(error){
        console.log({Nummer: "4", error: error.message})
    }
    io.emit("rooooms", rows)
    })
  })

 
  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`)
  })
})

io.listen(4000);

app.listen(5000, () => {
  console.log("running")
})