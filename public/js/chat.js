const socket = io()


//Elements 
const $messageForm= document.querySelector('#message-form')
const $messageFormInput= document.querySelector('input')
const $messageFormButton= document.querySelector('button')
const $sendLocationBUtton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


const autoscroll = ()=>{
    // New Message Element
    const $newMessage = $messages.lastElementChild

    // Height of the message 
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    

    // visible height 
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How have I scroll I scrolled
    const scrollOffSet = $messages.scrollHeight + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffSet){
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        message:message.text,
        time:moment(message.createdAt).format('h:mm a MM/DD/YYYY'),
        username:message.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('sendLocationMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate,{
        url:message.text,
        time:moment(message.createdAt).format('h:mm a'),
        username:message.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    // disabled
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = '';
        $messageFormInput.focus()
        if(error) return console.log(error);
        console.log('Message Delivered.')
    })
})

$sendLocationBUtton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationBUtton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',`${position.coords.latitude},${position.coords.longitude}`,(message)=>{
            $sendLocationBUtton.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData',({room,users})=>{
    console.log('room',room)
    console.log('users',users)
    const html = Mustache.render(sidebarTemplate,{
        room:room,
        users:users
    })
    document.querySelector('#sidebar').innerHTML = html
})